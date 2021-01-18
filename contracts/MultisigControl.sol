//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

import "./IMultisigControl.sol";
contract MultisigControl is IMultisigControl {
    constructor () {

        // set initial threshold to 50%
        threshold = 500;
        signers[msg.sender] = true;
        signer_count++;
        emit SignerAdded(msg.sender, 0);
    }

    uint16 threshold;
    uint8 signer_count;
    mapping(address => bool) signers;
    mapping(uint => bool) used_nonces;
    mapping(bytes32 => mapping(address => bool)) has_signed;

    event SignerAdded(address new_signer, uint256 nonce);
    event SignerRemoved(address old_signer, uint256 nonce);
    event ThresholdSet(uint16 new_threshold, uint256 nonce);

    //Sets threshold of signatures that must be met before function is executed. Emits 'ThresholdSet' event
    //Ethereum has no decimals, threshold is % * 10 so 50% == 500 100% == 1000
    // signatures are OK if they are >= threshold count of total valid signers
    function set_threshold(uint16 new_threshold, uint256 nonce, bytes memory signatures) public override{
        require(new_threshold <= 1000 && new_threshold > 0, "new threshold outside range");

        bytes memory message = abi.encode(new_threshold, nonce, "set_threshold");
        require(verify_signatures(signatures, message, nonce), "bad signatures");
        threshold = new_threshold;
        emit ThresholdSet(new_threshold, nonce);
    }

    //Adds new valid signer and adjusts signer count. Emits 'SignerAdded' event
    function add_signer(address new_signer, uint256 nonce, bytes memory signatures) public override{
        bytes memory message = abi.encode(new_signer, nonce, "add_signer");
        require(!signers[new_signer], "signer already exists");
        require(verify_signatures(signatures, message, nonce), "bad signatures");
        signers[new_signer] = true;
        signer_count++;
        emit SignerAdded(new_signer, nonce);
    }

    //Removes currently valid signer and adjust signer count. Emits 'SignerRemoved' event
    function remove_signer(address old_signer, uint256 nonce, bytes memory signatures) public override {
        bytes memory message = abi.encode(old_signer, nonce, "remove_signer");
        require(signers[old_signer], "signer doesn't exist");
        require(verify_signatures(signatures, message, nonce), "bad signatures");
        signers[old_signer] = false;
        signer_count--;
        emit SignerRemoved(old_signer, nonce);
    }

    //Verifies a signature bundle and returns true only if the threshold of valid signers is met,
    //this is a function that any function controlled by Vega MUST call to be securely controlled by the Vega network
    // message to hash to sign follows this pattern:
    // abi.encode( abi.encode(param1, param2, param3, ... , nonce, function_name_string), validating_contract_or_submitter_address);
    // Note that validating_contract_or_submitter_address is the the submitting party. If on MultisigControl contract itself, it's the submitting ETH address
    // if function on bridge that then calls Multisig, then it's the address of that contract
    // Note also the embedded encoding, this is required to verify what function/contract the function call goes to
    function verify_signatures(bytes memory signatures, bytes memory message, uint256 nonce) public override returns(bool) {
        require(signatures.length % 65 == 0, "bad sig length");
        require(!used_nonces[nonce], "nonce already used");
        uint8 sig_count = 0;

        bytes32 message_hash = keccak256(abi.encode(message, msg.sender));

        for(uint256 msg_idx = 32; msg_idx < signatures.length + 32; msg_idx+= 65){
            //recover address from that msg
            bytes32 r;
            bytes32 s;
            uint8 v;

            assembly {

            // first 32 bytes, after the length prefix
                r := mload(add(signatures, msg_idx))
            // second 32 bytes
                s := mload(add(signatures, add(msg_idx, 32)))
            // final byte (first byte of the next 32 bytes)
                v := byte(0, mload(add(signatures, add(msg_idx, 64))))
            }
            if (v < 27) v += 27;

            address recovered_address = ecrecover(message_hash, v, r, s);

            if(signers[recovered_address] && !has_signed[message_hash][recovered_address]){
                has_signed[message_hash][recovered_address] = true;
                sig_count++;
            }
        }
        used_nonces[nonce] = true;
        return ((uint256(sig_count) * 1000) / (uint256(signer_count))) > threshold;
    }
    //Returns number of valid signers
    function get_valid_signer_count() public override view returns(uint8){
        return signer_count;
    }
    event x(address addr);
    //Returns current threshold
    function get_current_threshold() public override view returns(uint16) {
        return threshold;
    }

    //Returns true if address provided is valid signer
    function is_valid_signer(address signer_address) public override view returns(bool){
        return signers[signer_address];
    }

    //returns true if nonce has been used
    function is_nonce_used(uint256 nonce) public override view returns(bool){
        return used_nonces[nonce];
    }
}

/*MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMM....................MMMMMNNMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMM....................MMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMM88=........................+MMMMMMMMMM
MMMMMMMMMMMMMMMMM....................MMMMM...MMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMM....................MMMMM...MMMMMMMMMMMMMMM
MMMMMMMMMMMM.........................MM+..MMM....+MMMMMMMMMM
MMMMMMMMMNMM...................... ..MM?..MMM.. .+MMMMMMMMMM
MMMMNDDMM+........................+MM........MM..+MMMMMMMMMM
MMMMZ.............................+MM....................MMM
MMMMZ.............................+MM....................MMM
MMMMZ.............................+MM....................DDD
MMMMZ.............................+MM..ZMMMMMMMMMMMMMMMMMMMM
MMMMZ.............................+MM..ZMMMMMMMMMMMMMMMMMMMM
MM..............................MMZ....ZMMMMMMMMMMMMMMMMMMMM
MM............................MM.......ZMMMMMMMMMMMMMMMMMMMM
MM............................MM.......ZMMMMMMMMMMMMMMMMMMMM
MM......................ZMMMMM.......MMMMMMMMMMMMMMMMMMMMMMM
MM............... ......ZMMMMM.... ..MMMMMMMMMMMMMMMMMMMMMMM
MM...............MMMMM88~.........+MM..ZMMMMMMMMMMMMMMMMMMMM
MM.......$DDDDDDD.......$DDDDD..DDNMM..ZMMMMMMMMMMMMMMMMMMMM
MM.......$DDDDDDD.......$DDDDD..DDNMM..ZMMMMMMMMMMMMMMMMMMMM
MM.......ZMMMMMMM.......ZMMMMM..MMMMM..ZMMMMMMMMMMMMMMMMMMMM
MMMMMMMMM+.......MMMMM88NMMMMM..MMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMM+.......MMMMM88NMMMMM..MMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM*/
