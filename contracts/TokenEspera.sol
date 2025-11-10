// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenEspera is ERC20 {
    uint256 public constant TOKEN_PRICE = 0.01 ether;
    address public owner;

    event TokenPurchased(address indexed buyer, uint256 amount);

    constructor() ERC20("TokenEspera", "TESP") {
        owner = msg.sender;
    }

    // Comprar tokens con tBNB (0.01 tBNB = 1 TESP)
    function comprarToken() external payable {
        require(msg.value >= TOKEN_PRICE, "Not enough tBNB");
        uint256 base = (msg.value * 1e18) / TOKEN_PRICE;
        uint256 bonus = balanceOf(msg.sender); // 1 extra por cada TESP ya poseido
        uint256 total = base + bonus;
        _mint(msg.sender, total);
        emit TokenPurchased(msg.sender, total);
    }

    // Retirar los tBNB acumulados (solo admin)
    function retirarFondos() external {
        require(msg.sender == owner, "Only owner");
        uint256 amount = address(this).balance;
        require(amount > 0, "No BNB to withdraw");
        payable(owner).transfer(address(this).balance);
    }
}
