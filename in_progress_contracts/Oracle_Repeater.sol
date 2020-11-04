pragma solidity ^0.4.0;

import "..\contracts\MultisigControl.sol";

contract Oracle_Repeater is MultisigControl {
    function submit_oracle_request();
    function oracle_callback();
    event Oracle_Result();
}
