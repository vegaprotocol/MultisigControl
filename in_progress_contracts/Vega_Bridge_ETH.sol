pragma solidity ^0.5.0;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./IERC20.sol";
import "./MultisigControl.sol";
import "./Killable.sol";
import "./IVega_Bridge_Payable.sol";

contract Vega_Bridge_ETH is Ownable, IVega_Bridge_Payable, Killable /*TODO Remove before Mainnet*/ {
    //stops overflow
    using SafeMath for uint256;

    bytes32 _vega_id;
    uint16 _network_id;

    function get_network_id() public view returns(uint16) {
        return _network_id;
    }

    constructor(bytes32 network_id) public{
        _network_id = network_id;
        _vega_id = keccak256(abi.encode(network_id, "VEGA_ETH"));
    }

    //Fallback function, rejects ETH not targeting specific vega pub key
    function() external {}

    address multisig_control_address;
    mapping(address => bool) whitelisted_tokens;
    uint256 minimum_deposit;

    //vega_id => asset_source
    mapping(bytes32 => address) vega_ids_to_source;
    mapping(address => bytes32) asset_source_to_vega_id;

    function get_vega_id() public view returns(bytes32){
        return _vega_id;
    }

    function set_deposit_minimum(uint256 nonce, uint256 minimum_amount, bytes memory signatures) public{
        bytes memory message = abi.encode(minimum_amount, nonce, 'set_deposit_minimum');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        minimum_deposit = minimum_amount;
        emit Asset_Deposit_Minimum_Set(asset_source, 0, minimum_amount, nonce);

    }


    function withdraw_asset(uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public {
        require(expiry > block.timestamp, "withdrawal has expired");

        bytes memory message = abi.encode(asset_source, asset_id, amount, expiry, msg.sender,  nonce, 'withdraw_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce), "bad signatures");

        address(msg.sender).transfer(amount);

        emit Asset_Withdrawn(msg.sender, asset_source, 0, amount, nonce);
    }

    function deposit_asset(uint256 amount, bytes32 vega_public_key) public  payable {
        require(amount >= minimum_deposit);

        require(amount == msg.value, "Amount/value mismatch");

        emit Asset_Deposited(msg.sender, asset_source, 0, amount, vega_public_key);
    }


    //TODO: bake into constructor(?)
    function set_multisig_control(address new_multisig_contract_address) public onlyOwner {
        multisig_control_address = new_multisig_contract_address;
        emit Multisig_Control_Set(new_multisig_contract_address);
    }

    // VIEWS /////////////////
    function get_deposit_minimum() public view returns(uint256){

        return minimum_deposit;

    }
    function get_multisig_control_address() public view returns(address) {
        return multisig_control_address;
    }



}
