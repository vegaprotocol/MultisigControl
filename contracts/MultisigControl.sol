//SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "./IMultisigControl.sol";

/// @title MultisigControl
/// @author Vega Protocol
/// @notice This contract enables validators, through a multisignature process, to run functions on contracts by consensus
contract MultisigControl is IMultisigControl {
    constructor () {
        signer_sequences[signer_sequence_number].signer_count = 1;
        signer_sequences[signer_sequence_number].threshold = 500;
        signer_sequences[signer_sequence_number].signers[msg.sender] = true;
        signer_sequence_number++;
    }

    mapping(uint => bool) used_nonces;

    struct Signer_Sequence{
      uint8 signer_count;
      uint16 threshold;
      mapping(address=>bool) signers;
    }

    uint256 public signer_sequence_number;
    mapping(uint256 => Signer_Sequence) signer_sequences;

    /**************************FUNCTIONS*********************/

    function update_signer_set(address[] calldata new_signers, uint16 new_threshold, uint256 nonce, uint256 sequence_number, bytes calldata signatures) public override {
      bytes memory message = abi.encode(new_signers, new_threshold, nonce, "update_signer_set");
      signer_sequences[signer_sequence_number].signer_count = uint8(new_signers.length);
      signer_sequences[signer_sequence_number].threshold = new_threshold;

      require(verify_signatures(signatures, message, nonce, sequence_number), "bad signatures");

      uint8 signer_count = 0;
      for(uint8 signer_idx = 0; signer_idx < new_signers.length; signer_idx++){
        if(!signer_sequences[signer_sequence_number].signers[new_signers[signer_idx]]){
          signer_sequences[signer_sequence_number].signers[new_signers[signer_idx]] = true;
          signer_count++;
        }
      }
      signer_sequence_number++;

    }


    mapping(bytes32=>bool) has_signed;
    bytes32[] signers;

    /// @notice Verifies a signature bundle and returns true only if the threshold of valid signers is met,
    /// @notice this is a function that any function controlled by Vega MUST call to be securely controlled by the Vega network
    /// @notice message to hash to sign follows this pattern:
    /// @notice keccak256(abi.encode( keccak256(abi.encode(param1, param2, param3, ... , nonce, sequence_number, function_name_string)), validating_contract_or_submitter_address));
    /// @notice Note that validating_contract_or_submitter_address is the submitting party. If on MultisigControl contract itself, it's the submitting ETH address
    /// @notice if function on bridge that then calls Multisig, then it's the address of that contract
    /// @notice Note also the embedded encoding, this is required to verify what function/contract the function call goes to
    /// @return Returns true if valid signatures are over the threshold
    function verify_signatures(bytes calldata signatures, bytes memory message, uint256 nonce, uint256 sequence_number) public override returns(bool) {
        require(signer_sequences[sequence_number].signer_count>0, "invalid sequence number");
        require(signatures.length % 65 == 0, "bad sig length");
        require(!used_nonces[nonce], "nonce already used");
        uint8 sig_count = 0;

        bytes32 message_hash = keccak256(abi.encode(message, msg.sender, sequence_number));
        delete(signers);
        uint256 offset;
        assembly {
          offset := signatures.offset
        }
        for(uint256 msg_idx = 0; msg_idx < signatures.length; msg_idx+= 65){
            //recover address from that msg
            bytes32 r;
            bytes32 s;
            uint8 v;
            assembly {

            // first 32 bytes, after the length prefix
                r := calldataload(add(offset,msg_idx))
            // second 32 bytes
                s := calldataload(add(add(offset,msg_idx), 32))
            // final byte (first byte of the next 32 bytes)
                v := byte(0, calldataload(add(add(offset,msg_idx), 64)))
            }
            // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
            // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
            // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
            // signatures from current libraries generate a unique signature with an s-value in the lower half order.
            //
            // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
            // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
            // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
            // these malleable signatures as well.
            require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "Malleable signature error");
            if (v < 27) v += 27;

            address recovered_address = ecrecover(message_hash, v, r, s);
            bytes32 signer_hash = keccak256(abi.encode(nonce, recovered_address));

            if(signer_sequences[sequence_number].signers[recovered_address] && !has_signed[signer_hash]){
                has_signed[signer_hash] = true;
                sig_count++;
                signers.push(signer_hash);
            }
        }
        used_nonces[nonce] = true;

        /// @Dev fun fact, mappings don't work in functions
        for(uint8 signer_idx = 0; signer_idx < signers.length; signer_idx++){
          delete(has_signed[signers[signer_idx]]);
        }
        return ((uint256(sig_count) * 1000) / (uint256(signer_sequences[sequence_number].signer_count))) > signer_sequences[sequence_number].threshold;
    }

    function disable_sequence_number(uint256 sequence_to_disable, uint256 nonce, uint256 sequence_number, bytes calldata signatures) public override {
      bytes memory message = abi.encode(sequence_to_disable, nonce, "disable_sequence_number");
      require(verify_signatures(signatures, message, nonce, sequence_number), "bad signatures");

      delete(signer_sequences[sequence_to_disable]);
    }

    /// @return Number of valid signers
    function get_signer_count(uint256 sequence_number) public override view returns(uint8){
        return signer_sequences[sequence_number].signer_count;
    }

    /// @return Current threshold
    function get_threshold(uint256 sequence_number) public override view returns(uint16) {
        return signer_sequences[sequence_number].threshold;
    }

    /// @param signer_address target potential signer address
    /// @return true if address provided is valid signer
    function is_valid_signer(address signer_address, uint256 sequence_number) public override view returns(bool){
        return signer_sequences[sequence_number].signers[signer_address];
    }

    /// @param nonce Nonce to lookup
    /// @return true if nonce has been used
    function is_nonce_used(uint256 nonce) public override view returns(bool){
        return used_nonces[nonce];
    }
}

/**
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMWEMMMMMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMLOVEMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMMMMMHIXELMMMMMMMMMMMM....................MMMMMNNMMMMMM
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
