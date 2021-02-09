//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;
import "./Ownable.sol";

/*
 * Killable
 * Base contract that can be killed by owner. All funds in contract will be sent to the owner.
 */
contract Killable is Ownable {
    function kill() public onlyOwner {
        address payable wallet =address(uint160(owner()));
        selfdestruct(wallet);
    }
}
