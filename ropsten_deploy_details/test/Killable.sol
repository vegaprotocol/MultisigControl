pragma solidity 0.5.16;
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
