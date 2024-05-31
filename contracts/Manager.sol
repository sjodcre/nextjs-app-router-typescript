// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
// import "./ERC20Test.sol";
import "./ERC20Lock.sol";

contract Manager {
    address public feeReceiver;
    uint256 public feeAmount;
    address public contractOwner;

    event ERC20Deployed(address indexed contractAddress, address indexed owner);

    constructor(address _feeReceiver, uint256 _feeAmount, address _contractOwner) {
        feeReceiver = _feeReceiver;
        feeAmount = _feeAmount;
        contractOwner = _contractOwner;
    }
    function deployERC20(uint256 _reserveRatio, string memory _name, string memory _symbol, address initialMinter, uint256 initialMintValue) external payable {
    // function deployERC20(uint256 _reserveRatio, string memory _name, string memory _symbol, address initialMinter, uint256 initialMintValue) external payable {
        // require(msg.value >= feeAmount, "Insufficient fee");
        require(msg.value >= feeAmount + initialMintValue, "Insufficient fee and initial mint value");

        uint256 mintFee = (initialMintValue * 1) / 101; // Calculate 1% fee
        uint256 netValue = initialMintValue - mintFee; // Net value after fee
        payable(feeReceiver).transfer(mintFee);
        // Transfer the fee to the fee receiver
        payable(feeReceiver).transfer(feeAmount);

        // Deploy the ERC20 contract with the initial mint value
        // ERC20Lock newToken = new ERC20Lock(_reserveRatio, _name, _symbol, contractOwner, initialMinter, netValue);
        ERC20Lock newToken = new ERC20Lock{value: netValue}(_reserveRatio, _name, _symbol, contractOwner, initialMinter, netValue);

        // Deploy the ERC20 contract
        // ERC20Lock newToken = new ERC20Lock(_reserveRatio, _name, _symbol);

        // Emit the event with the contract address
        emit ERC20Deployed(address(newToken), msg.sender);

        // If there is an initial mint value, transfer it to the new contract
        // if (initialMintValue > 0) {
        //     payable(address(newToken)).transfer(initialMintValue);
        // }
    }
}