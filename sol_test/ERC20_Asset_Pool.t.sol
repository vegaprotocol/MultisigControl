// SPDX-license-identifier: MIT
pragma solidity ^0.8.8;

import {Test, console2, Vm} from "forge-std/Test.sol";
import {MultisigControl} from "../contracts/MultisigControl.sol";
import {ERC20_Asset_Pool} from "../contracts/ERC20_Asset_Pool.sol";

contract TestBase is Test {
  function deployMultisigControl() internal returns (MultisigControl) {
    return new MultisigControl();
  }

  function deployERC20AssetPool(address multisig) internal returns (ERC20_Asset_Pool) {
    return new ERC20_Asset_Pool(multisig);
  }
}

contract SetMultisigControl is TestBase {
  function test_failZeroAddress() public {
    vm.expectRevert();
    deployERC20AssetPool(address(0));
  }

  function test_failChangeToZeroAddress() public {
    MultisigControl multisigControl = deployMultisigControl();
    ERC20_Asset_Pool assetPool = deployERC20AssetPool(address(multisigControl));
    assertEq(address(assetPool.multisig_control_address()), address(multisigControl));
  }
}
