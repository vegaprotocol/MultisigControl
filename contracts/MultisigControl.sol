pragma solidity ^0.5.0;

import "./Ownable.sol";

contract MultisigControl is Ownable {
    constructor () public{
        threshold = 1000;
        add_signer_admin(msg.sender);
    }

    uint16 threshold;
    uint8 signer_count;
    mapping(address => bool) signers;
    mapping(uint => bool) used_nonces;

    event SignerAdded(address new_signer, uint256 nonce);
    event SignerRemoved(address old_signer, uint256 nonce);
    event ThresholdSet(uint16 new_threshold, uint256 nonce);

    /************************ SANDBOX *****/
    function get_msg_bytes(address target) public view returns (bytes memory) {
        //0xb89a165ea8b619c14312db316baaa80d2a98b493
        bytes memory message = abi.encode(target, uint256(0), "add_signer");
        return abi.encode(message, msg.sender);
    }
    function get_msg_hash(address target) public view returns (bytes32) {
        return keccak256(get_msg_bytes(target));
    }

    /*************************/


    /*******************ADMIN(note: this only is needed in order to simplify initial onboarding of nodes, once ownership is surrendered these will no longer be available)*/
    //REMOVE BEFORE FLIGHT
    event SignerAdded_Admin(address new_signer);
    event SignerRemoved_Admin(address old_signer);
    event ThresholdSet_Admin(uint16 new_threshold);

    function add_signer_admin(address new_signer) public onlyOwner{
        require(!signers[new_signer], "signer already exists");
        signers[new_signer] = true;
        signer_count++;
        emit SignerAdded_Admin(new_signer);
    }

    function remove_signer_admin(address old_signer) public onlyOwner{
        require(signers[old_signer], "signer doesn't exist");
        signers[old_signer] = false;
        signer_count--;
        emit SignerRemoved_Admin(old_signer);
    }

    function set_threshold_admin(uint16 new_threshold) public onlyOwner{
        threshold = new_threshold;
        emit ThresholdSet_Admin(new_threshold);
    }

    /*********************END ADMIN*/


    //Sets threshold of signatures that must be met before function is executed. Emits 'ThresholdSet' event
    //Ethereum has no decimals, threshold is % * 10 so 50% == 500 100% == 1000
    // signatures are OK if they are >= threshold count of total valid signers
    function set_threshold(uint16 new_threshold, uint nonce, bytes memory signatures) public{
        bytes memory message = abi.encode(new_threshold, nonce, "set_threshold");
        require(verify_signatures(signatures, message, nonce), "bad signatures");
        //todo: add sanity check
        threshold = new_threshold;
        emit ThresholdSet(new_threshold, nonce);
    }

    //Adds new valid signer and adjusts signer count. Emits 'SignerAdded' event
    function add_signer(address new_signer, uint nonce, bytes memory signatures) public {
        bytes memory message = abi.encode(new_signer, nonce, "add_signer");
        require(!signers[new_signer], "signer already exists");
        require(verify_signatures(signatures, message, nonce), "bad signatures");
        //todo: add sanity check
        signers[new_signer] = true;
        signer_count++;
        emit SignerAdded(new_signer, nonce);
    }

    //Removes currently valid signer and adjust signer count. Emits 'SignerRemoved' event
    function remove_signer(address old_signer, uint nonce, bytes memory signatures) public {
        bytes memory message = abi.encode(old_signer, nonce, "remove_signer");
        require(signers[old_signer], "signer doesn't exist");
        require(verify_signatures(signatures, message, nonce), "bad signatures");
        //todo: add sanity check
        signers[old_signer] = false;
        signer_count--;
        emit SignerRemoved(old_signer, nonce);
    }

    mapping(bytes32 => mapping(address => bool)) has_signed;

    //Verifies a signature bundle and returns true only if the threshold of valid signers is met,
    //this is a function that any function controlled by Vega MUST call to be securely controlled by the Vega network
    // message to hash to sign follows this pattern:
    // abi.encode( abi.encode(param1, param2, param3, ... , nonce, function_name_string), validating_contract_or_submitter_address);
    // Note that validating_contract_or_submitter_address is the the submitting party. If on MultisigControl contract itself, it's the submitting ETH address
    // if function on bridge that then calls Multisig, then it's the address of that contract
    // Note also the embedded encoding, this is required to verify what function/contract the function call goes to
    function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        require(signatures.length % 65 == 0, "bad sig length");
        require(!used_nonces[nonce], "nonce already used");
        uint8 sig_count = 0;

        bytes32 message_hash = keccak256(abi.encode(message, msg.sender));

        for(uint msg_idx = 32; msg_idx < signatures.length + 32; msg_idx+= 65){
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
        //TODO: get math correct
        return ((sig_count * 1000)/ (signer_count )) >= threshold;
        //return sig_count > 0;//((sig_count * 1000) / (uint256(signer_count) * 1000)) > threshold;
    }

    //Returns number of valid signers
    function get_valid_signer_count() public view returns(uint8){
        return signer_count;
    }

    //Returns current threshold
    function get_current_threshold() public view returns(uint16) {
        return threshold;
    }

    //Returns true if address provided is valid signer
    function is_valid_signer(address signer_address) public view returns(bool){
        return signers[signer_address];
    }

    //returns true if nonce has been used
    function is_nonce_used(uint nonce) public view returns(bool){
        return used_nonces[nonce];
    }
}




/*
function submit_signature_bundle(bytes memory signatures, bytes32 message_hash) public returns(address){
        require(signatures.length % 65 == 0, "bad sig length");

        address last_address;

        for(uint msg_idx = 32; msg_idx < signatures.length + 32; msg_idx+= 65){
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

            address recovered_address = ecrecover(batch_id, v, r, s);
            last_address = recovered_address;
            //require(recovered_address != address(0), "cannot recover address");
        }
        return last_address;
    }

    function splitSignature(bytes memory sig)
        internal
        pure
        returns (uint8, bytes32, bytes32)
    {
        require(sig.length == 65);

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }
    function recoverSigner(bytes32 message, bytes memory sig)
        public
        pure
        returns (address)
    {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }
    address the_address = 0x80C67eEC6f8518B5Bb707ECc718B53782AC71543;
    bool flag;
    function recoverSignerWithFlag(bytes32 message, bytes memory sig) public returns(bool) {

        flag =  recoverSigner(message, sig) == the_address;
        return flag;
    }

    function recoverBundleWithFlag(bytes memory signatures, bytes32 batch_id)  public returns(bool) {

        flag =  submit_signature_bundle(signatures, batch_id) == the_address;
        return flag;
    }


*/