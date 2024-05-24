// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FudToken is ERC20 {
    address public owner;
    uint256 public maxSupply;

    constructor(uint256 initialSupply, uint256 _maxSupply) ERC20("FudToken", "FUD") {
        owner = msg.sender;
        maxSupply = _maxSupply;
        _mint(msg.sender, initialSupply);
    }

    function mintToSender(uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint");
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(msg.sender, amount);
    }
}
