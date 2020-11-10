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

    constructor(bytes32 vega_id) public{
        _vega_id = vega_id;
    }

    //Fallback function, rejects ETH not targeting specific vega pub key
    function() external {}

    address multisig_control_address;
    mapping(address => bool) whitelisted_tokens;
    mapping(address => uint256) minimum_deposits;

    //vega_id => asset_source
    mapping(bytes32 => address) vega_ids_to_source;
    mapping(address => bytes32) asset_source_to_vega_id;

    function get_vega_id(address asset_source, uint256 asset_id) public view returns(bytes32){
        require(asset_source == address(0) && asset_id == 0, "ETH is native, 0s for asset_source and asset_id");
        return _vega_id;
    }
    function get_asset_source_and_asset_id(bytes32 vega_id) public view returns(address, uint256){
        require(vega_id == _vega_id);
        return (address(0), 0);
    }

    function whitelist_asset(address, uint256, bytes32, uint256, bytes memory) public {
        revert("Nothing to whitelist");
    }
    function blacklist_asset(address, uint256, uint256, bytes memory) public {
        revert("Nothing to blacklist");
    }

    function set_deposit_minimum(address asset_source, uint256 asset_id, uint256 nonce, uint256 minimum_amount, bytes memory signatures) public{
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");

        bytes memory message = abi.encode(asset_source, asset_id, minimum_amount, nonce, 'set_deposit_minimum');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        minimum_deposits[asset_source] = minimum_amount;
        emit Asset_Deposit_Minimum_Set(asset_source, 0, minimum_amount, nonce);

    }


    function withdraw_asset(address asset_source, uint256 asset_id, uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public {
        require(asset_source == address(0) && asset_id == 0, "ETH is native, 0s for asset_source and asset_id");
        require(expiry > block.timestamp, "withdrawal has expired");

        bytes memory message = abi.encode(asset_source, asset_id, amount, expiry, msg.sender,  nonce, 'withdraw_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce), "bad signatures");

        address(msg.sender).transfer(amount);

        emit Asset_Withdrawn(msg.sender, asset_source, 0, amount, nonce);
    }

    function deposit_asset(address asset_source, uint256 asset_id, uint256 amount, bytes32 vega_public_key) public  payable {
        require(asset_source == address(0) && asset_id == 0,"ETH is native, 0s for asset_source and asset_id");

        require(amount >= minimum_deposits[asset_source]);

        require(amount == msg.value, "Amount/value mismatch");

        emit Asset_Deposited(msg.sender, asset_source, 0, amount, vega_public_key);
    }


    //TODO: bake into constructor(?)
    function set_multisig_control(address new_multisig_contract_address) public onlyOwner {
        multisig_control_address = new_multisig_contract_address;
        emit Multisig_Control_Set(new_multisig_contract_address);
    }

    // VIEWS /////////////////
    function is_asset_whitelisted(address asset_source, uint256 asset_id) public view returns(bool){
        return asset_source == address(0) && asset_id == 0;
    }
    function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256){
        require(asset_source == address(0) && asset_id == 0,"ETH is native, 0s for asset_source and asset_id");

        return minimum_deposits[asset_source];

    }
    function get_multisig_control_address() public view returns(address) {
        return multisig_control_address;
    }



}
