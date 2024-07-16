// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { BancorBondingCurve } from "./BancorBondingCurve.sol";
import { CappedGasPrice } from "./CappedGasPrice.sol";

contract ERC20Lock is BancorBondingCurve, ERC20Pausable, CappedGasPrice, Ownable {
    ERC20 public reserveToken;
    uint256 public scale = 10**16;
    uint256 public reserveBalance = 10 * scale;
    uint256 public reserveRatio;
    address private feeReceiver = 0x372173ca23790098F17f376F59858a086Cae9Fb0; // Address to receive fees
    bool public liquidityPoolSetup = false;
    // uint256 public marketCap;
    // uint256 public maxMarketCap = 10**18;
    uint256 public MAX_TOKEN_SUPPLY = 541899193367184 * 10**4;
    uint256 public constant MAX_RESERVE_BALANCE = 50 * 10**16; // Set manually as per requirement
    address[] private lockedTokenAddresses; 
    mapping(address => uint256) public lockedTokens;
    mapping(address => bool) private hasLockedTokens;


    error ErrorZeroReserveTokenProvided();
    error ErrorZeroContinuousTokenProvided();
    error ErrorInsufficientTokensToBurn();
    error ErrorSlippageLimitExceeded();

    event ContinuousMint(address indexed account, uint256 amount, uint256 deposit);
    event ContinuousBurn(address indexed account, uint256 amount, uint256 reimburseAmount);
    event TokensLocked(address indexed account, uint256 amount);
    event TokensUnlocked(address indexed account, uint256 amount);

    constructor(
        uint256 _reserveRatio,
        string memory _name,
        string memory _symbol,
        address contractOwner,
        address initialMinter,
        uint256 initialMintValue
    ) ERC20(_name, _symbol) CappedGasPrice() Ownable(contractOwner) payable {
        reserveRatio = _reserveRatio;
        _mint(address(this), 500 * scale);

        if (initialMintValue > 0) {
            uint256 tokensToMint = calculateContinuousMintReturn(initialMintValue);
            _mint(initialMinter, tokensToMint);
            reserveBalance += initialMintValue;
            emit ContinuousMint(msg.sender, tokensToMint, initialMintValue);
        }
    }

    function mint(uint256 minTokens) external payable validGasPrice whenNotPaused {
        require(!liquidityPoolSetup, "Liquidity pool setup, minting is disabled");
        uint256 fee = (msg.value * 1) / 101; // Calculate 1% fee
        uint256 netValue = msg.value - fee; // Net value after fee
        uint256 tokensToMint = calculateContinuousMintReturn(netValue);
        require(tokensToMint >= minTokens, "ErrorSlippageLimitExceeded");

        _continuousMint(netValue, tokensToMint, fee, msg.value);
    }


    function burn(uint256 _amount, uint256 minReturn) external validGasPrice whenNotPaused {
        require(!liquidityPoolSetup, "Liquidity pool setup, minting is disabled");
        require(balanceOf(msg.sender) - lockedTokens[msg.sender] >= _amount, "ErrorInsufficientTokensToBurn");
        uint256 returnAmount = calculateContinuousBurnReturn(_amount);
        if (returnAmount < minReturn) {
            revert ErrorSlippageLimitExceeded();
        }

        _continuousBurn(_amount, returnAmount);
    }

    function calculateContinuousMintReturn(uint256 _amount) public view returns (uint256 mintAmount) {
        return calculatePurchaseReturn(totalSupply(), reserveBalance, uint32(reserveRatio), _amount);
    }

    function calculateContinuousBurnReturn(uint256 _amount) public view returns (uint256 burnAmount) {
        return calculateSaleReturn(totalSupply(), reserveBalance, uint32(reserveRatio), _amount);
    }

    function _continuousMint(uint256 _deposit, uint256 amount, uint256 initialFee, uint256 initialDeposit) private {

        // require(totalSupply() + amount <= maxTokenSupply, "ErrorMaxTokenSupplyExceeded");
        uint256 totalSupplyAfterMint = totalSupply() + amount;
        uint256 excessAmount = totalSupplyAfterMint > MAX_TOKEN_SUPPLY ? totalSupplyAfterMint - MAX_TOKEN_SUPPLY : 0;
        uint256 refundAmount = 0;

        // uint256 marginOfError = MAX_TOKEN_SUPPLY / 10000; // 0.01% of max token supply
        if (excessAmount > 0) {
            uint256 remainingTokens = MAX_TOKEN_SUPPLY - totalSupply();
            amount = remainingTokens;//remaining available to mint

            uint256 reserveBalanceAfterMint = reserveBalance + _deposit;
            if(reserveBalanceAfterMint > MAX_RESERVE_BALANCE){
                uint256 excessReserveBalance = reserveBalanceAfterMint - MAX_RESERVE_BALANCE;
                uint256 actualDeposit = _deposit - excessReserveBalance;

                refundAmount = excessReserveBalance;

                // fee = actualDeposit * 1/100;
                // Recalculate fee based on the actual deposit
                uint256 newFee = (actualDeposit * 1) / 101;
                refundAmount += initialFee - newFee;
                // payable(msg.sender).transfer(excessReserveBalance); // Refund the excess amount
                _deposit = actualDeposit; // Update _deposit to actualDeposit
                initialFee = newFee; // Update the fee

            } else {
                refundAmount = initialDeposit - _deposit - initialFee;
            }
        }

        _mint(msg.sender, amount);
        reserveBalance += _deposit;
        payable(feeReceiver).transfer(initialFee); // Transfer fee to the fee receiver

        // uint256 totalSupplyAfterMint = totalSupply();
        // marketCap = (_deposit * totalSupplyAfterMint) / amount;

        emit ContinuousMint(msg.sender, amount, _deposit);

        // Pause the contract and unlock all tokens if total supply reaches maxTokenSupply
        if (totalSupply() >= MAX_TOKEN_SUPPLY) {
                       
            _withdrawERC20Tokens(address(this), balanceOf(address(this)));
            // _pause();
            liquidityPoolSetup = true;
            _unlockAllTokens();

        } else {
            _applyRandomLock(amount);
        }

        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount); // Refund any excess amount
        }
    }

    function _continuousBurn(uint256 _amount, uint256 reimburseAmount) private {
        _burn(msg.sender, _amount);
        reserveBalance -= reimburseAmount;
        uint256 fee = (reimburseAmount * 1) / 100; // Calculate 1% fee
        uint256 netReturn = reimburseAmount - fee; // Net return after fee
        payable(msg.sender).transfer(netReturn);
        payable(feeReceiver).transfer(fee); // Transfer fee to the fee receiver

        // uint256 totalSupplyAfterBurn = totalSupply();
        // marketCap = (reimburseAmount * totalSupplyAfterBurn) / _amount;

        emit ContinuousBurn(msg.sender, _amount, reimburseAmount);
    }

    function _applyRandomLock(uint256 tokensToMint) private {
        uint256 randomness = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 2;
        if (randomness == 0) {
            // Lock tokens
            lockedTokens[msg.sender] += tokensToMint;
            if (!hasLockedTokens[msg.sender]) {
                lockedTokenAddresses.push(msg.sender);
                hasLockedTokens[msg.sender] = true;
            }
            emit TokensLocked(msg.sender, tokensToMint);
        } else {
            // Unlock all tokens
            uint256 locked = lockedTokens[msg.sender];
            lockedTokens[msg.sender] = 0;
            hasLockedTokens[msg.sender] = false;
            emit TokensUnlocked(msg.sender, locked);
        }
    }

    function _unlockAllTokens() private {
        for (uint i = 0; i < lockedTokenAddresses.length; i++) {
            address account = lockedTokenAddresses[i];
            uint256 locked = lockedTokens[account];
            if (locked > 0) {
                lockedTokens[account] = 0;
                hasLockedTokens[account] = false;
                emit TokensUnlocked(account, locked);
            }
        }
    }

    function getLockedTokens(address account) external view returns (uint256) {
        return lockedTokens[account];
    }

    function isLiquidityPoolSetup() external view returns (bool) {
        return liquidityPoolSetup;
    }

    // function pause() external onlyOwner {
    //     _pause();
    // }

    // function unpause() external onlyOwner {
    //     _unpause();
    // }

    function setLiquidityPoolSetup(bool _setup) external onlyOwner {
        liquidityPoolSetup = _setup;
    }

    function withdrawNativeTokens(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    function _withdrawERC20Tokens(address tokenAddress, uint256 amount) private {
        IERC20 token = IERC20(tokenAddress);
        require(amount <= token.balanceOf(address(this)), "Insufficient token balance");
        token.transfer(owner(), amount);
    }

    // function withdrawERC20Tokens(address tokenAddress, uint256 amount) external onlyOwner {
    //     IERC20 token = IERC20(tokenAddress);
    //     require(amount <= token.balanceOf(address(this)), "Insufficient token balance");
    //     token.transfer(owner(), amount);
    // }

    function getTokensRemaining() external view returns (uint256) {
        // require(marketCap <= maxMarketCap, "Market cap exceeds the maximum limit");
        return MAX_TOKEN_SUPPLY - totalSupply();
    }

    function getMaxTokenSupply() external view returns (uint256) {
    return MAX_TOKEN_SUPPLY;
    }
}
