// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CappedGasPrice {
    uint256 public maxGasPrice = 1 * 10**18; // Adjustable value

    constructor() {}

    modifier validGasPrice() {
        require(tx.gasprice <= maxGasPrice, "Transaction gas price cannot exceed maximum gas price.");
        _;
    }

    // function setMaxGasPrice(uint256 gasPrice) public onlyOwner {
    //     maxGasPrice = gasPrice;
    // }
}