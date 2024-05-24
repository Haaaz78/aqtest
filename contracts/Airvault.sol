// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AirVault {
    IERC20 public fudToken;
    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor(address _fudToken) {
        fudToken = IERC20(_fudToken);
    }

    function deposit(uint256 amount) external returns (bool) {
        require(amount > 0, "Deposit amount must be greater than zero");
        fudToken.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        totalDeposits += amount;
        emit Deposit(msg.sender, amount);
        return true;
    }

    function withdraw(uint256 amount) external returns (bool) {
        require(amount > 0 && amount <= deposits[msg.sender], "Invalid withdraw amount");
        fudToken.transfer(msg.sender, amount);
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        emit Withdraw(msg.sender, amount);
        return true;
    }

    function lockedBalanceOf(address account) external view returns (uint256) {
        return deposits[account];
    }
}
