// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import { BancorBondingCurve } from "./BancorBondingCurve.sol";
import { CappedGasPrice } from "./CappedGasPrice.sol";

contract ERC20Test is BancorBondingCurve, ERC20, CappedGasPrice {
    ERC20 public reserveToken;
    uint256 public scale = 10**16;
    uint256 public reserveBalance = 10*scale;
    uint256 public reserveRatio;
    address public feeReceiver = 0x372173ca23790098F17f376F59858a086Cae9Fb0; // Address to receive fees



    error ErrorZeroReserveTokenProvided();
    error ErrorZeroContinuousTokenProvided();
    error ErrorInsufficientTokensToBurn();
    error ErrorSlippageLimitExceeded();

    // Updated event signatures to include timestamp
    event ContinuousMint(address indexed account, uint256 amount, uint256 deposit);
    event ContinuousBurn(address indexed account, uint256 amount, uint256 reimburseAmount);

    constructor(
        uint256 _reserveRatio,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) CappedGasPrice() {
        reserveRatio = _reserveRatio;
        _mint(address(this), 1*scale);
    }

    function mint(uint256 minTokens) external payable validGasPrice {
        uint256 fee = (msg.value * 1) / 101; // Calculate 1% fee
        uint256 netValue = msg.value - fee; // Net value after fee
        uint256 tokensToMint = calculateContinuousMintReturn(netValue);
        require(tokensToMint >= minTokens, "ErrorSlippageLimitExceeded");

        _continuousMint(netValue, tokensToMint, fee);
    }

    function burn(uint256 _amount, uint256 minReturn) external validGasPrice {
        uint256 returnAmount = calculateContinuousBurnReturn(_amount);
        // require(returnAmount >= minReturn, "ErrorSlippageLimitExceeded");
        if (returnAmount < minReturn) {
            revert ErrorSlippageLimitExceeded();
        }
        uint256 fee = (returnAmount * 1) / 100; // Calculate 1% fee
        uint256 netReturn = returnAmount - fee; // Net return after fee
        _continuousBurn(_amount, netReturn,fee);
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

    // function _continuousMint(uint256 _deposit) private returns (uint256) {
    //     if (_deposit == 0) {
    //         revert ErrorZeroReserveTokenProvided();
    //     }

    //     uint256 amount = calculateContinuousMintReturn(_deposit);
    //     _mint(msg.sender, amount);
    //     reserveBalance += _deposit;
    //     emit ContinuousMint(msg.sender, amount, _deposit);  // Emitting the event with a timestamp
    //     return amount;
    // }

    // function _continuousBurn(uint256 _amount) private returns (uint256) {
    //     if (_amount == 0) {
    //         revert ErrorZeroContinuousTokenProvided();
    //     }
    //     if (balanceOf(msg.sender) < _amount) {
    //         revert ErrorInsufficientTokensToBurn();
    //     }

    //     uint256 reimburseAmount = calculateContinuousBurnReturn(_amount);
    //     reserveBalance -= reimburseAmount;
    //     _burn(msg.sender, _amount);
    //     emit ContinuousBurn(msg.sender, _amount, reimburseAmount);  
    //     return reimburseAmount;
    // }
}