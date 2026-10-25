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

contract TitanteoRejectingNativeReceiver {
    receive() external payable {
        revert("SYNTHETIC_NATIVE_RECEIVER_REJECTS_PAYMENT");
    }
}

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
    // H57: A mixed ERC20 + native batch should have identical outcomes on
    // Base and Mainnet, regardless of the order of the two payout actions.
    function testFuzz_DifferentialMixedTokenAndNative(
        uint80 assetRaw, uint80 nativeRaw, uint24 ppmRaw, uint24 capRaw, bool nativeFirst
    ) public {
        uint256 assetBalance = 2 + uint256(assetRaw);
        uint256 nativeBalance = 2 + uint256(nativeRaw);
        uint256 ppm = 1 + uint256(ppmRaw) % BASIS;
        uint256 cap = 1 + uint256(capRaw) % BASIS;
        asset.mint(address(base), assetBalance);
        asset.mint(address(mainnet), assetBalance);
        vm.deal(address(base), nativeBalance);
        vm.deal(address(mainnet), nativeBalance);

        bytes[] memory a = new bytes[](2);
        bytes[] memory b = new bytes[](2);
        uint256 tokenIx = nativeFirst ? 1 : 0;
        uint256 nativeIx = 1 - tokenIx;
        a[tokenIx] = _action(rBase, IERC20(address(asset)), assetBalance / 3, ppm, cap);
        b[tokenIx] = _action(rMain, IERC20(address(asset)), assetBalance / 3, ppm, cap);
        a[nativeIx] = _action(rBase, NATIVE, nativeBalance / 3, ppm, cap);
        b[nativeIx] = _action(rMain, NATIVE, nativeBalance / 3, ppm, cap);
        _executeBoth(a, b);
        assertEq(asset.balanceOf(rBase), asset.balanceOf(rMain), "token payout depends on chain dispatch");
        assertEq(rBase.balance, rMain.balance, "native payout depends on chain dispatch");
        assertEq(asset.balanceOf(address(base)), asset.balanceOf(address(mainnet)), "token remainder differs");
        assertEq(address(base).balance, address(mainnet).balance, "native remainder differs");
        assertEq(asset.balanceOf(address(base)) + asset.balanceOf(rBase), assetBalance, "base token accounting");
        assertEq(asset.balanceOf(address(mainnet)) + asset.balanceOf(rMain), assetBalance, "mainnet token accounting");
        assertEq(address(base).balance + rBase.balance, nativeBalance, "base native accounting");
        assertEq(address(mainnet).balance + rMain.balance, nativeBalance, "mainnet native accounting");
    }

    // H57: A recipient callback that rejects ETH must not leave a previous
    // token payout committed. A later legitimate execution must remain usable.
    function testFuzz_DifferentialFailedNativeCallbackRollsBackEarlierToken(
        uint80 assetRaw, uint80 nativeRaw
    ) public {
        uint256 assetBalance = 1 + uint256(assetRaw);
        uint256 nativeBalance = 1 + uint256(nativeRaw);
        TitanteoRejectingNativeReceiver rejecting = new TitanteoRejectingNativeReceiver();
        asset.mint(address(base), assetBalance);
        asset.mint(address(mainnet), assetBalance);
        vm.deal(address(base), nativeBalance);
        vm.deal(address(mainnet), nativeBalance);

        bytes[] memory a = new bytes[](2);
        bytes[] memory b = new bytes[](2);
        a[0] = _action(rBase, IERC20(address(asset)), 0, BASIS, BASIS);
        b[0] = _action(rMain, IERC20(address(asset)), 0, BASIS, BASIS);
        a[1] = _action(address(rejecting), NATIVE, 0, BASIS, BASIS);
        b[1] = _action(address(rejecting), NATIVE, 0, BASIS, BASIS);

        ISettlerBase.AllowedSlippage memory slip = ISettlerBase.AllowedSlippage({
            recipient: payable(address(0)), buyToken: IERC20(address(0)), minAmountOut: 0
        });
        vm.expectRevert();
        base.execute(slip, a, bytes32(0));
        vm.expectRevert();
        mainnet.execute(slip, b, bytes32(0));
        assertEq(asset.balanceOf(rBase), 0, "base leaked earlier token payout after revert");
        assertEq(asset.balanceOf(rMain), 0, "mainnet leaked earlier token payout after revert");
        assertEq(asset.balanceOf(address(base)), assetBalance);
        assertEq(asset.balanceOf(address(mainnet)), assetBalance);
        assertEq(address(base).balance, nativeBalance);
        assertEq(address(mainnet).balance, nativeBalance);

        // Same test transaction: after failed batches, a valid call works.
        bytes[] memory validA = new bytes[](2);
        bytes[] memory validB = new bytes[](2);
        validA[0] = a[0];
        validB[0] = b[0];
        validA[1] = _action(rBase, NATIVE, 0, BASIS, BASIS);
        validB[1] = _action(rMain, NATIVE, 0, BASIS, BASIS);
        _executeBoth(validA, validB);
        assertEq(asset.balanceOf(rBase), assetBalance);
        assertEq(asset.balanceOf(rMain), assetBalance);
        assertEq(rBase.balance, nativeBalance);
        assertEq(rMain.balance, nativeBalance);
        assertEq(asset.balanceOf(address(base)), 0);
        assertEq(asset.balanceOf(address(mainnet)), 0);
        assertEq(address(base).balance, 0);
        assertEq(address(mainnet).balance, 0);
    }

}
