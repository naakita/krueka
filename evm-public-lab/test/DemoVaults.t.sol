// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/DemoVaults.sol";

interface Vm {
    function deal(address who, uint256 newBalance) external;
}
interface IDemoVault {
    function deposit() external payable;
    function withdraw() external;
}

contract DemoReceiver {
    IDemoVault public vault;
    uint256 public callbackCount;
    constructor(IDemoVault _vault) { vault = _vault; }
    function trigger() external payable {
        require(msg.value == 1 ether, "one ether");
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }
    receive() external payable {
        callbackCount++;
        if (address(vault).balance >= 1 ether && callbackCount < 20) {
            vault.withdraw();
        }
    }
}
contract DemoHonest {
    function depositTo(IDemoVault vault) external payable {
        vault.deposit{value: msg.value}();
    }
    function withdrawFrom(IDemoVault vault) external {
        vault.withdraw();
    }
    receive() external payable {}
}

contract DemoEvmTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function setUp() public {
        vm.deal(address(this), 100 ether);
    }

    function testVulnerableFixture_DemonstratesUnauthorizedWithdrawal() public {
        DemoVaultVulnerable vault = new DemoVaultVulnerable();
        vault.deposit{value: 10 ether}();
        DemoReceiver receiver = new DemoReceiver(IDemoVault(address(vault)));
        receiver.trigger{value: 1 ether}();
        require(address(vault).balance == 0, "demo should be drained");
        require(address(receiver).balance == 11 ether, "incorrect demo payment");
        require(receiver.callbackCount() == 11, "wrong callback count");
    }

    function testFixedVault_RejectsRecursiveWithdrawal() public {
        DemoVaultFixed vault = new DemoVaultFixed();
        vault.deposit{value: 10 ether}();
        DemoReceiver receiver = new DemoReceiver(IDemoVault(address(vault)));
        bool rejected;
        try receiver.trigger{value: 1 ether}() { rejected = false; }
        catch { rejected = true; }
        require(rejected, "expected revert");
        require(address(vault).balance == 10 ether, "lost legitimate deposit");
        require(address(receiver).balance == 0, "transaction should be atomic");
        require(vault.balances(address(receiver)) == 0, "credit persisted");
        require(receiver.callbackCount() == 0, "callback persistence");
    }

    function testFixedVault_HonestWithdrawal() public {
        DemoVaultFixed vault = new DemoVaultFixed();
        DemoHonest alice = new DemoHonest();
        alice.depositTo{value: 3 ether}(IDemoVault(address(vault)));
        alice.withdrawFrom(IDemoVault(address(vault)));
        require(address(alice).balance == 3 ether, "honest balance");
        require(vault.balances(address(alice)) == 0, "credit not cleared");
        require(address(vault).balance == 0, "funds not withdrawn");
    }

    function testFixedVault_CannotSpendAnotherUsersDeposit() public {
        DemoVaultFixed vault = new DemoVaultFixed();
        DemoHonest alice = new DemoHonest();
        DemoHonest bob = new DemoHonest();
        alice.depositTo{value: 5 ether}(IDemoVault(address(vault)));
        bob.depositTo{value: 2 ether}(IDemoVault(address(vault)));
        bob.withdrawFrom(IDemoVault(address(vault)));
        require(vault.balances(address(alice)) == 5 ether, "alice claim changed");
        require(address(vault).balance == 5 ether, "alice funds spent");
    }

    function testFixedVault_RejectsRepeatWithdrawal() public {
        DemoVaultFixed vault = new DemoVaultFixed();
        DemoHonest alice = new DemoHonest();
        alice.depositTo{value: 2 ether}(IDemoVault(address(vault)));
        alice.withdrawFrom(IDemoVault(address(vault)));
        bool rejected;
        try alice.withdrawFrom(IDemoVault(address(vault))) { rejected = false; }
        catch { rejected = true; }
        require(rejected, "double withdrawal accepted");
    }

    function testFixedVault_RejectsZeroDeposit() public {
        DemoVaultFixed vault = new DemoVaultFixed();
        bool rejected;
        try vault.deposit{value: 0}() { rejected = false; }
        catch { rejected = true; }
        require(rejected, "zero deposit accepted");
    }

    function testFuzz_FixedVaultPreservesHonestFunds(uint64 raw) public {
        uint256 amount = (uint256(raw) % 9 + 1) * 1 ether;
        DemoVaultFixed vault = new DemoVaultFixed();
        DemoHonest alice = new DemoHonest();
        alice.depositTo{value: amount}(IDemoVault(address(vault)));
        alice.withdrawFrom(IDemoVault(address(vault)));
        require(address(alice).balance == amount, "fuzz: funds lost");
        require(address(vault).balance == 0, "fuzz: vault not empty");
    }
}
