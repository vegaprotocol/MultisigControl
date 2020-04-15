pragma solidity ^0.5.0;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./IERC20.sol";
import "./IVega_Bridge.sol";
import "./MultisigControl.sol";

contract Vega_Bridge_ERC20 is IVega_Bridge, Ownable {
    //stops overflow
    using SafeMath for uint256;

    address multisig_control_address;
    mapping(address => bool) whitelisted_tokens;
    mapping(address => uint256) minimum_deposits;

    /**********************ADMIN REMOVE BEFORE MAINNET*******************************/
    function whitelist_asset_admin(address asset_source, uint256 asset_id) public onlyOwner {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(!whitelisted_tokens[asset_source], "asset already whitelisted");
        whitelisted_tokens[asset_source] = true;
        emit Asset_Whitelisted(asset_source, 0, uint256(asset_source) + block.number);
    }
    function blacklist_asset_admin(address asset_source, uint256 asset_id) public onlyOwner {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");
        whitelisted_tokens[asset_source] = false;
        emit Asset_Blacklisted(asset_source, 0, uint256(asset_source) + block.number);
    }
    /**********************END ADMIN*******************************/


    function whitelist_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(!whitelisted_tokens[asset_source], "asset already whitelisted");
        bytes memory message = abi.encode(asset_source, asset_id, nonce, 'whitelist_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        whitelisted_tokens[asset_source] = true;
        emit Asset_Whitelisted(asset_source, 0, nonce);
    }
    function blacklist_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");
        bytes memory message = abi.encode(asset_source, asset_id, nonce, 'blacklist_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        whitelisted_tokens[asset_source] = false;
        emit Asset_Blacklisted(asset_source, 0, nonce);
    }
    function set_deposit_minimum(address asset_source, uint256 asset_id, uint256 nonce, uint256 minimum_amount, bytes memory signatures) public{
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");

        bytes memory message = abi.encode(asset_source, asset_id, minimum_amount, nonce, 'set_deposit_minimum');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        minimum_deposits[asset_source] = minimum_amount;
        emit Asset_Deposit_Minimum_Set(asset_source, 0, minimum_amount, nonce);

    }
    function withdraw_asset(address asset_source, uint256 asset_id, uint256 amount, uint256 nonce, bytes memory signatures) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");

        bytes memory message = abi.encode(asset_source, asset_id, amount, msg.sender,  nonce, 'withdraw_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce), "bad signatures");

        require(IERC20(asset_source).transfer(msg.sender, amount), "token didn't transfer");

        emit Asset_Withdrawn(msg.sender, asset_source, 0, amount, nonce);
    }
    function deposit_asset(address asset_source, uint256 asset_id, uint256 amount, bytes32 vega_public_key) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");
        //User must run approve before deposit
        require(amount >= minimum_deposits[asset_source]);
        require(IERC20(asset_source).transferFrom(msg.sender, address(this), amount));
        emit Asset_Deposited(msg.sender, asset_source, 0, amount, vega_public_key);
    }
    function set_multisig_control(address new_multisig_contract_address) public onlyOwner {
        multisig_control_address = new_multisig_contract_address;
        emit Multisig_Control_Set(new_multisig_contract_address);
    }

    // VIEWS /////////////////
    function is_asset_whitelisted(address asset_source, uint256 asset_id) public view returns(bool){
        return whitelisted_tokens[asset_source] && asset_id == 0;
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
