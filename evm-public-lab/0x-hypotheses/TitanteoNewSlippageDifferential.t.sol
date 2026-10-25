// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// TITANTEO — independent local EVM differential regressions.
// Compare generic Base and optimized Mainnet dispatch for POSITIVE_SLIPPAGE.
// No mainnet / public testnet calls; all balances are synthetic.
import {Test} from "@forge-std/Test.sol";
import {IERC20} from "@forge-std/interfaces/IERC20.sol";
import {MockERC20} from "@solmate/test/utils/mocks/MockERC20.sol";
import {BaseSettler} from "src/chains/Base/TakerSubmitted.sol";
import {MainnetSettler} from "src/chains/Mainnet/TakerSubmitted.sol";
import {USDC, USDT} from "src/core/MakerPSM.sol";
import {ISettlerActions} from "src/ISettlerActions.sol";
import {ISettlerBase} from "src/interfaces/ISettlerBase.sol";

contract TitanteoNewSlippageDifferential is Test {
    uint256 internal constant BASIS = 1_000_000;
    IERC20 internal constant NATIVE = IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    BaseSettler internal base;
    MainnetSettler internal mainnet;
    MockERC20 internal asset;
    MockERC20 internal unrelated;
    address payable internal rBase;
    address payable internal rMain;

    function setUp() public {
        vm.mockCall(address(USDC), abi.encodeCall(IERC20.decimals, ()), abi.encode(uint8(6)));
        vm.mockCall(address(USDT), abi.encodeCall(IERC20.decimals, ()), abi.encode(uint8(6)));
        base = new BaseSettler(bytes20(0));
        mainnet = new MainnetSettler(bytes20(0));
        asset = new MockERC20("Titanteo Differential", "TDF", 18);
        unrelated = new MockERC20("Unrelated", "UNR", 18);
        rBase = payable(makeAddr("base-payout"));
        rMain = payable(makeAddr("mainnet-payout"));
    }

    function _action(address recipient, IERC20 token, uint256 expected, uint256 surplusPpm, uint256 capPpm)
        internal pure returns (bytes memory)
    {
        return abi.encodeCall(ISettlerActions.POSITIVE_SLIPPAGE, (payable(recipient), address(token), expected, surplusPpm, capPpm));
    }

    function _executeBoth(bytes[] memory forBase, bytes[] memory forMain) internal {
        ISettlerBase.AllowedSlippage memory emptySlippage = ISettlerBase.AllowedSlippage({
            recipient: payable(address(0)), buyToken: IERC20(address(0)), minAmountOut: 0
        });
        base.execute(emptySlippage, forBase, bytes32(0));
        mainnet.execute(emptySlippage, forMain, bytes32(0));
    }

    function testFuzz_DifferentialTokenSurplus(uint96 balanceRaw, uint96 expectedRaw, uint24 surplusRaw, uint24 maxRaw) public {
        uint256 balance = 1 + uint256(balanceRaw);
        uint256 expected = uint256(expectedRaw) % (balance + 1);
        uint256 surplus = uint256(surplusRaw) % (BASIS + 1);
        uint256 cap = uint256(maxRaw) % (BASIS + 1);
        asset.mint(address(base), balance);
        asset.mint(address(mainnet), balance);
        bytes[] memory a = new bytes[](1);
        bytes[] memory b = new bytes[](1);
        a[0] = _action(rBase, IERC20(address(asset)), expected, surplus, cap);
        b[0] = _action(rMain, IERC20(address(asset)), expected, surplus, cap);
        _executeBoth(a,b);
        assertEq(asset.balanceOf(rBase), asset.balanceOf(rMain), "different payout from two dispatch paths");
        assertEq(asset.balanceOf(address(base)), asset.balanceOf(address(mainnet)), "different remainder between dispatches");
        assertEq(asset.balanceOf(address(base)) + asset.balanceOf(rBase), balance, "generic asset conservation");
        assertEq(asset.balanceOf(address(mainnet)) + asset.balanceOf(rMain), balance, "mainnet asset conservation");
    }

    function testFuzz_DifferentialNativeSurplus(uint88 balanceRaw, uint88 expectedRaw, uint24 surplusRaw, uint24 maxRaw) public {
        uint256 balance = 1 + uint256(balanceRaw);
        uint256 expected = uint256(expectedRaw) % (balance + 1);
        uint256 surplus = uint256(surplusRaw) % (BASIS + 1);
        uint256 cap = uint256(maxRaw) % (BASIS + 1);
        vm.deal(address(base), balance);
        vm.deal(address(mainnet), balance);
        bytes[] memory a = new bytes[](1);
        bytes[] memory b = new bytes[](1);
        a[0] = _action(rBase, NATIVE, expected, surplus, cap);
        b[0] = _action(rMain, NATIVE, expected, surplus, cap);
        _executeBoth(a,b);
        assertEq(rBase.balance, rMain.balance, "different native payout");
        assertEq(address(base).balance, address(mainnet).balance, "different native remainder");
        assertEq(rBase.balance + address(base).balance, balance, "native conservation");
    }

    function testFuzz_DifferentialTwoConsecutivePayouts(uint80 balanceRaw, uint24 expectedRaw, uint24 surplusRaw, uint24 maxRaw) public {
        uint256 balance = 1 + uint256(balanceRaw);
        uint256 expected = uint256(expectedRaw) % (balance + 1);
        uint256 surplus = uint256(surplusRaw) % (BASIS + 1);
        uint256 cap = uint256(maxRaw) % (BASIS + 1);
        asset.mint(address(base), balance);
        asset.mint(address(mainnet), balance);
        bytes[] memory a = new bytes[](2);
        bytes[] memory b = new bytes[](2);
        for (uint256 i; i < 2; i++) {
            a[i] = _action(rBase, IERC20(address(asset)), expected, surplus, cap);
            b[i] = _action(rMain, IERC20(address(asset)), expected, surplus, cap);
        }
        _executeBoth(a,b);
        assertEq(asset.balanceOf(rBase), asset.balanceOf(rMain), "cumulative payout diverged");
        assertEq(asset.balanceOf(address(base)), asset.balanceOf(address(mainnet)), "cumulative remainder diverged");
        assertLe(asset.balanceOf(rBase), balance, "paid more than originally held");
    }

    function testFuzz_DifferentialCrossAssetIsolation(uint88 balanceRaw, uint64 unrelatedRaw) public {
        uint256 balance = 1 + uint256(balanceRaw);
        uint256 isolated = 1 + uint256(unrelatedRaw);
        asset.mint(address(base), balance);
        asset.mint(address(mainnet), balance);
        unrelated.mint(address(base), isolated);
        unrelated.mint(address(mainnet), isolated);
        vm.deal(address(base), isolated);
        vm.deal(address(mainnet), isolated);
        bytes[] memory a = new bytes[](1);
        bytes[] memory b = new bytes[](1);
        a[0] = _action(rBase, IERC20(address(asset)), 0, 250000, 500000);
        b[0] = _action(rMain, IERC20(address(asset)), 0, 250000, 500000);
        _executeBoth(a,b);
        assertEq(unrelated.balanceOf(address(base)), isolated, "generic touched unrelated token");
        assertEq(unrelated.balanceOf(address(mainnet)), isolated, "mainnet touched unrelated token");
        assertEq(address(base).balance, isolated, "generic touched unrelated ETH");
        assertEq(address(mainnet).balance, isolated, "mainnet touched unrelated ETH");
        assertEq(asset.balanceOf(rBase), asset.balanceOf(rMain), "asset isolation payout differs");
    }
}
