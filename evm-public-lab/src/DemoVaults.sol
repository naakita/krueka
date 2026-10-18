// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Deliberately insecure; testing only on isolated EVM.
contract DemoVaultVulnerable {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        require(msg.value > 0, "zero deposit");
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "no balance");
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "payment failed");
        balances[msg.sender] = 0;
    }
}

/// @notice Corrected checks-effects-interactions variant.
contract DemoVaultFixed {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        require(msg.value > 0, "zero deposit");
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "no balance");
        balances[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "payment failed");
    }
}
