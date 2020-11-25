pragma solidity ^0.5.0;

import "./SafeMath.sol";
import "./IERC20.sol";
import "./IERC20_Bridge_Logic.sol";
import "./MultisigControl.sol";
import "./ERC20_Asset_Pool.sol";

//TODO remove before mainnet
import "./Ownable.sol";
import "./Killable.sol";

contract ERC20_Bridge_Logic is IERC20_Bridge_Logic, Ownable, Killable /*TODO Remove Owner and Killable before Mainnet*/ {
    //stops overflow
    using SafeMath for uint256;

    address multisig_control_address;
    address erc20_asset_pool_address;
    mapping(address => bool) listed_tokens;
    mapping(address => uint256) minimum_deposits;

    constructor(address erc20_asset_pool, address multisig_control) public {
        erc20_asset_pool_address = erc20_asset_pool;
        multisig_control_address = multisig_control;
    }

    /**********************ADMIN REMOVE BEFORE MAINNET*******************************/
    function list_asset_admin(address asset_source, uint256 asset_id, bytes32 vega_id) public onlyOwner {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(!listed_tokens[asset_source], "asset already listed");
        listed_tokens[asset_source] = true;
        vega_ids_to_source[vega_id] = asset_source;
        asset_source_to_vega_id[asset_source] = vega_id;
        emit Asset_Listed(asset_source, 0, vega_id,  uint256(asset_source) + block.number);
    }
    function remove_asset_admin(address asset_source, uint256 asset_id) public onlyOwner {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(listed_tokens[asset_source], "asset not listed");
        listed_tokens[asset_source] = false;
        emit Asset_Removed(asset_source, 0,  uint256(asset_source) + block.number);
    }
    /**********************END ADMIN*******************************/

    //vega_id => asset_source
    mapping(bytes32 => address) vega_ids_to_source;
    mapping(address => bytes32) asset_source_to_vega_id;

    function get_vega_id(address asset_source, uint256 asset_id) public view returns(bytes32){
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        return asset_source_to_vega_id[asset_source];
    }
    function get_asset_source_and_asset_id(bytes32 vega_id) public view returns(address, uint256){
        return (vega_ids_to_source[vega_id], 0);
    }

    function list_asset(address asset_source, uint256 asset_id, bytes32 vega_id, uint256 nonce, bytes memory signatures) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(!listed_tokens[asset_source], "asset already listed");
        bytes memory message = abi.encode(asset_source, asset_id, vega_id, nonce, 'list_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        listed_tokens[asset_source] = true;
        vega_ids_to_source[vega_id] = asset_source;
        asset_source_to_vega_id[asset_source] = vega_id;
        emit Asset_Listed(asset_source, 0, vega_id, nonce);
    }
    function remove_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(listed_tokens[asset_source], "asset not listed");
        bytes memory message = abi.encode(asset_source, asset_id, nonce, 'remove_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        listed_tokens[asset_source] = false;
        emit Asset_Removed(asset_source, 0, nonce);
    }
    function set_deposit_minimum(address asset_source, uint256 asset_id, uint256 nonce, uint256 minimum_amount, bytes memory signatures) public{
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(listed_tokens[asset_source], "asset not listed");

        bytes memory message = abi.encode(asset_source, asset_id, minimum_amount, nonce, 'set_deposit_minimum');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        minimum_deposits[asset_source] = minimum_amount;
        emit Asset_Deposit_Minimum_Set(asset_source, 0, minimum_amount, nonce);

    }
    function withdraw_asset(address asset_source, uint256 asset_id, uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(listed_tokens[asset_source], "asset not listed");
        require(expiry > block.timestamp, "withdrawal has expired");

        bytes memory message = abi.encode(asset_source, asset_id, amount, expiry, msg.sender,  nonce, 'withdraw_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce), "bad signatures");

        require(ERC20_Asset_Pool(erc20_asset_pool_address).withdraw(asset_source, msg.sender, amount), "token didn't transfer, rejected by asset pool.");

        emit Asset_Withdrawn(msg.sender, asset_source, 0, amount, nonce);
    }
    function deposit_asset(address asset_source, uint256 asset_id, uint256 amount, bytes32 vega_public_key) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(listed_tokens[asset_source], "asset not listed");
        //User must run approve before deposit

        require(amount >= minimum_deposits[asset_source], "deposit below minimum");
        require(IERC20(asset_source).transferFrom(msg.sender, erc20_asset_pool_address, amount), "transfer failed in deposit");

        emit Asset_Deposited(msg.sender, asset_source, 0, amount, vega_public_key);
    }

    // VIEWS /////////////////
    function is_asset_listed(address asset_source, uint256 asset_id) public view returns(bool){
        return listed_tokens[asset_source] && asset_id == 0;
    }
    function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256){
        if(asset_id != 0){
            return 0;
        } else {
            return minimum_deposits[asset_source];
        }
    }
    function get_multisig_control_address() public view returns(address) {
        return multisig_control_address;
    }



}
