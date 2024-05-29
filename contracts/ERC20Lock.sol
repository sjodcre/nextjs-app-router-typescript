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
    mapping(address => uint256) public lockedTokens;

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
        address initialOwner,
        uint256 initialMintValue

    ) ERC20(_name, _symbol) CappedGasPrice() Ownable(initialOwner) {
        reserveRatio = _reserveRatio;
        _mint(address(this), 1 * scale);

        // if (initialMintValue > 0) {
        //     uint256 fee = (initialMintValue * 1) / 101; // Calculate 1% fee
        //     uint256 netValue = initialMintValue - fee; // Net value after fee
        //     uint256 tokensToMint = calculateContinuousMintReturn(netValue);
        //     _continuousMint(netValue, tokensToMint, fee);
        // }
    }

    function mint(uint256 minTokens) external payable validGasPrice whenNotPaused {
        uint256 fee = (msg.value * 1) / 101; // Calculate 1% fee
        uint256 netValue = msg.value - fee; // Net value after fee
        uint256 tokensToMint = calculateContinuousMintReturn(netValue);
        require(tokensToMint >= minTokens, "ErrorSlippageLimitExceeded");

        _continuousMint(netValue, tokensToMint, fee);
        _applyRandomLock(tokensToMint);
    }

    function burn(uint256 _amount, uint256 minReturn) external validGasPrice whenNotPaused{
        require(balanceOf(msg.sender) - lockedTokens[msg.sender] >= _amount, "ErrorInsufficientTokensToBurn");
        uint256 returnAmount = calculateContinuousBurnReturn(_amount);
        if (returnAmount < minReturn) {
            revert ErrorSlippageLimitExceeded();
        }
        uint256 fee = (returnAmount * 1) / 100; // Calculate 1% fee
        uint256 netReturn = returnAmount - fee; // Net return after fee
        _continuousBurn(_amount, netReturn, fee);
    }

    function calculateContinuousMintReturn(uint256 _amount) public view returns (uint256 mintAmount) {
        return calculatePurchaseReturn(totalSupply(), reserveBalance, uint32(reserveRatio), _amount);
    }

    function calculateContinuousBurnReturn(uint256 _amount) public view returns (uint256 burnAmount) {
        return calculateSaleReturn(totalSupply(), reserveBalance, uint32(reserveRatio), _amount);
    }

    function _continuousMint(uint256 _deposit, uint256 amount, uint256 fee) private {
        _mint(msg.sender, amount);
        reserveBalance += _deposit;
        payable(feeReceiver).transfer(fee); // Transfer fee to the fee receiver
        emit ContinuousMint(msg.sender, amount, _deposit);
    }

    function _continuousBurn(uint256 _amount, uint256 reimburseAmount, uint256 fee) private {
        _burn(msg.sender, _amount);
        reserveBalance -= reimburseAmount;
        payable(msg.sender).transfer(reimburseAmount);
        payable(feeReceiver).transfer(fee); // Transfer fee to the fee receiver
        emit ContinuousBurn(msg.sender, _amount, reimburseAmount);
    }

    function _applyRandomLock(uint256 tokensToMint) private {
        uint256 randomness = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 2;
        if (randomness == 0) {
            // Lock tokens
            lockedTokens[msg.sender] += tokensToMint;
            emit TokensLocked(msg.sender, tokensToMint);
        } else {
            // Unlock all tokens
            uint256 locked = lockedTokens[msg.sender];
            lockedTokens[msg.sender] = 0;
            emit TokensUnlocked(msg.sender, locked);
        }
    }

    function getLockedTokens(address account) external view returns (uint256) {
        return lockedTokens[account];
    }

        function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawNativeTokens(uint256 amount) external onlyOwner {
    require(amount <= address(this).balance, "Insufficient balance");
    payable(owner()).transfer(amount);
    }

    function withdrawERC20Tokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(amount <= token.balanceOf(address(this)), "Insufficient token balance");
        token.transfer(owner(), amount);
    }

}
