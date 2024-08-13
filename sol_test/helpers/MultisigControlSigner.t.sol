// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Test, Vm, console2} from "forge-std/Test.sol";

contract MultisigControlSigningHelper is Test {
  function sign(uint256 privateKey, bytes memory args, address submitter) public view returns (bytes memory) {
    bytes32 digest = keccak256(abi.encodePacked(bytes1(0x19), block.chainid, abi.encode(args, submitter)));

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

    return abi.encodePacked(r, s, v);
  }

  function sign(uint256[] memory privateKeys, bytes memory args, address submitter) public view returns (bytes memory) {
    bytes memory signatures;
    for (uint256 i = 0; i < privateKeys.length; i++) {
      signatures = abi.encodePacked(signatures, sign(privateKeys[i], args, submitter));
    }
    return signatures;
  }

  function sign(Vm.Wallet memory wallet, bytes memory args, address submitter) public view returns (bytes memory) {
    return sign(wallet.privateKey, args, submitter);
  }

  function sign(Vm.Wallet[] memory wallets, bytes memory args, address submitter) public view returns (bytes memory) {
    uint256[] memory privateKeys = new uint256[](wallets.length);
    for (uint256 i = 0; i < wallets.length; i++) {
      privateKeys[i] = wallets[i].privateKey;
    }
    return sign(privateKeys, args, submitter);
  }
}
