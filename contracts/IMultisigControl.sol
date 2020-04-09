pragma solidity ^0.5.0;

import "./Ownable.sol";

contract MultisigControl is Ownable {

    /***************************EVENTS****************************/
    event SignerAdded(address new_signer);
    event SignerRemoved(address old_signer);
    event ThresholdSet(uint16 new_threshold);

    //Sets threshold of signatures that must be met before function is executed. Emits 'ThresholdSet' event
    //Ethereum has no decimals, threshold is % * 10 so 50% == 500 100% == 1000
    // signatures are OK if they are >= threshold count of total valid signers
    function set_threshold(uint16 new_threshold, uint nonce, bytes memory signatures) public;

    //Adds new valid signer and adjusts signer count. Emits 'SignerAdded' event
    function add_signer(address new_signer, uint nonce, bytes memory signatures) public;

    //Removes currently valid signer and adjust signer count. Emits 'SignerRemoved' event
    function remove_signer(address old_signer, uint nonce, bytes memory signatures) public;

    //Verifies a signature bundle and returns true only if the threshold of valid signers is met,
    //this is a function that any function controlled by Vega MUST call to be securely controlled by the Vega network
    // message to hash to sign follows this pattern:
    // abi.encode( abi.encode(param1, param2, param3, ... , nonce, function_name_string), validating_contract_or_submitter_address);
    // Note that validating_contract_or_submitter_address is the the submitting party. If on MultisigControl contract itself, it's the submitting ETH address
    // if function on bridge that then calls Multisig, then it's the address of that contract
    // Note also the embedded encoding, this is required to verify what function/contract the function call goes to
    function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool);



    /**********************VIEWS*********************/
    //Returns number of valid signers
    function get_valid_signer_count() public view returns(uint8);
    
    //Returns current threshold
    function get_current_threshold() public view returns(uint16);
    
    //Returns true if address provided is valid signer
    function is_valid_signer(address signer_address) public view returns(bool);
    
    //returns true if nonce has been used
    function is_nonce_used(uint nonce) public view returns(bool);
}

