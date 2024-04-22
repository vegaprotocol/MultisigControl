// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Test, console2, Vm} from "forge-std/Test.sol";
import {MultisigControlSigningHelper} from "./helpers/MultisigControlSigner.t.sol";

import {MultisigControl} from "../contracts/MultisigControl.sol";
import {ERC20_Asset_Pool} from "../contracts/ERC20_Asset_Pool.sol";
import {ERC20_Bridge_Logic_Restricted} from "../contracts/ERC20_Bridge_Logic_Restricted.sol";
import {SquidReceiver} from "../contracts/SquidReceiver.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestBase is Test, MultisigControlSigningHelper {
  MultisigControl multisigControl;
  ERC20_Asset_Pool assetPool;
  ERC20_Bridge_Logic_Restricted bridge;

  Vm.Wallet[] signers;

  uint256 _nonce;

  function nonce() public returns (uint256) {
    return _nonce++;
  }

  function setUp() public virtual {
    signers.push(vm.createWallet("Signer 1"));
    signers.push(vm.createWallet("Signer 2"));
    signers.push(vm.createWallet("Signer 3"));

    vm.startPrank(signers[0].addr);
    multisigControl = new MultisigControl();
    assetPool = new ERC20_Asset_Pool(address(multisigControl));
    bridge = new ERC20_Bridge_Logic_Restricted(payable(address(assetPool)));

    // set threshold to 1
    uint256 n = nonce();
    bytes memory setThresholdSignature = sign(signers[0].privateKey, abi.encode(1, n, "set_threshold"), signers[0].addr);
    multisigControl.set_threshold(1, n, setThresholdSignature);

    // add signer 2
    n = nonce();
    bytes memory addSignerSignature =
      sign(signers[0].privateKey, abi.encode(signers[1].addr, n, "add_signer"), signers[0].addr);
    multisigControl.add_signer(signers[1].addr, n, addSignerSignature);

    // add signer 3
    n = nonce();
    addSignerSignature = sign(signers[0].privateKey, abi.encode(signers[2].addr, n, "add_signer"), signers[0].addr);
    multisigControl.add_signer(signers[2].addr, n, addSignerSignature);

    // set bridge address
    n = nonce();
    bytes memory setBridgeSignature =
      sign(signers, abi.encode(address(bridge), n, "set_bridge_address"), address(assetPool));
    assetPool.set_bridge_address(address(bridge), n, setBridgeSignature);
    vm.stopPrank();
  }
}

contract TERC20 is ERC20 {
  constructor(string memory name, string memory symbol) ERC20(name, symbol) {
    _mint(msg.sender, type(uint256).max);
  }
}

contract TestSquidReceive is TestBase {
  SquidReceiver squidReceiver;

  Vm.Wallet user;

  function setUp() public override {
    super.setUp();

    squidReceiver = new SquidReceiver(bridge);
    user = vm.createWallet("User");
  }

  function test_ListedAsset() external {
    IERC20 asset = new TERC20("Test Token", "TST");
    asset.transfer(user.addr, 1000);

    uint256 n = nonce();
    bytes memory listAssetSignature =
      sign(signers, abi.encode(address(asset), bytes32("TST"), 0, 0, n, "list_asset"), address(bridge));
    bridge.list_asset(address(asset), bytes32("TST"), 0, 0, n, listAssetSignature);

    squidReceiver.approve(asset);

    vm.startPrank(user.addr);
    asset.approve(address(squidReceiver), 1000);
    squidReceiver.deposit(asset, 1000, bytes32("Vega Address"), user.addr);
    vm.stopPrank();

    assertEq(asset.balanceOf(address(squidReceiver)), 0);
    assertEq(asset.balanceOf(user.addr), 0);
    assertEq(asset.balanceOf(address(bridge)), 0);
    assertEq(asset.balanceOf(address(assetPool)), 1000);

    vm.prank(user.addr);
    squidReceiver.recover(asset);

    assertEq(asset.balanceOf(address(squidReceiver)), 0);
    assertEq(asset.balanceOf(user.addr), 0);
    assertEq(asset.balanceOf(address(bridge)), 0);
    assertEq(asset.balanceOf(address(assetPool)), 1000);
  }

  function test_UnlistedAsset() external {
    IERC20 asset = new TERC20("Test Token", "TST");
    asset.transfer(user.addr, 1000);

    squidReceiver.approve(asset);

    vm.startPrank(user.addr);
    asset.approve(address(squidReceiver), 1000);
    squidReceiver.deposit(asset, 1000, bytes32("Vega Address"), user.addr);
    vm.stopPrank();

    assertEq(asset.balanceOf(address(squidReceiver)), 1000);
    assertEq(asset.balanceOf(user.addr), 0);
    assertEq(asset.balanceOf(address(bridge)), 0);
    assertEq(asset.balanceOf(address(assetPool)), 0);

    vm.prank(user.addr);
    squidReceiver.recover(asset);

    assertEq(asset.balanceOf(address(squidReceiver)), 0);
    assertEq(asset.balanceOf(user.addr), 1000);
    assertEq(asset.balanceOf(address(bridge)), 0);
    assertEq(asset.balanceOf(address(assetPool)), 0);
  }

  function test_NoApprove() external {
    IERC20 asset = new TERC20("Test Token", "TST");
    asset.transfer(user.addr, 1000);

    uint256 n = nonce();
    bytes memory listAssetSignature =
      sign(signers, abi.encode(address(asset), bytes32("TST"), 0, 0, n, "list_asset"), address(bridge));
    bridge.list_asset(address(asset), bytes32("TST"), 0, 0, n, listAssetSignature);

    vm.startPrank(user.addr);
    asset.approve(address(squidReceiver), 1000);
    squidReceiver.deposit(asset, 1000, bytes32("Vega Address"), user.addr);
    vm.stopPrank();

    assertEq(asset.balanceOf(address(squidReceiver)), 1000);
    assertEq(asset.balanceOf(user.addr), 0);
    assertEq(asset.balanceOf(address(bridge)), 0);
    assertEq(asset.balanceOf(address(assetPool)), 0);

    vm.prank(user.addr);
    squidReceiver.recover(asset);

    assertEq(asset.balanceOf(address(squidReceiver)), 0);
    assertEq(asset.balanceOf(user.addr), 1000);
    assertEq(asset.balanceOf(address(bridge)), 0);
    assertEq(asset.balanceOf(address(assetPool)), 0);
  }

  function test_StoppedBridge() external {
    IERC20 asset = new TERC20("Test Token", "TST");
    asset.transfer(user.addr, 2000);

    uint256 n = nonce();
    bytes memory listAssetSignature =
      sign(signers, abi.encode(address(asset), bytes32("TST"), 0, 0, n, "list_asset"), address(bridge));
    bridge.list_asset(address(asset), bytes32("TST"), 0, 0, n, listAssetSignature);

    squidReceiver.approve(asset);

    vm.startPrank(user.addr);
    asset.approve(address(squidReceiver), 1000);
    squidReceiver.deposit(asset, 1000, bytes32("Vega Address"), user.addr);
    vm.stopPrank();

    assertEq(asset.balanceOf(address(squidReceiver)), 0);
    assertEq(asset.balanceOf(user.addr), 1000);
    assertEq(asset.balanceOf(address(bridge)), 0);
    assertEq(asset.balanceOf(address(assetPool)), 1000);

    n = nonce();
    bytes memory stopBridgeSignature = sign(signers, abi.encode(n, "global_stop"), address(bridge));
    bridge.global_stop(n, stopBridgeSignature);

    vm.startPrank(user.addr);
    asset.approve(address(squidReceiver), 1000);
    squidReceiver.deposit(asset, 1000, bytes32("Vega Address"), user.addr);
    vm.stopPrank();

    assertEq(asset.balanceOf(address(squidReceiver)), 1000);
    assertEq(asset.balanceOf(user.addr), 0);
    assertEq(asset.balanceOf(address(bridge)), 0);
    assertEq(asset.balanceOf(address(assetPool)), 1000);

    vm.prank(user.addr);
    squidReceiver.recover(asset);

    assertEq(asset.balanceOf(address(squidReceiver)), 0);
    assertEq(asset.balanceOf(user.addr), 1000);
    assertEq(asset.balanceOf(address(bridge)), 0);
    assertEq(asset.balanceOf(address(assetPool)), 1000);
  }
}
