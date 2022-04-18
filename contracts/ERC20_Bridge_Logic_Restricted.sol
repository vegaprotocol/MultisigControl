//SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "./IERC20.sol";
import "./IERC20_Bridge_Logic_Restricted.sol";
import "./IMultisigControl.sol";
import "./ERC20_Asset_Pool.sol";

/// @title ERC20 Bridge Logic
/// @author Vega Protocol
/// @notice This contract is used by Vega network users to deposit and withdraw ERC20 tokens to/from Vega.
// @notice All funds deposited/withdrawn are to/from the assigned ERC20_Asset_Pool
contract ERC20_Bridge_Logic_Restricted is IERC20_Bridge_Logic_Restricted {

    address payable erc20_asset_pool_address;
    // asset address => is listed
    mapping(address => bool) listed_tokens;
    // asset address => minimum deposit amt
    mapping(address => uint256) minimum_deposits;
    // asset address => maximum deposit amt
    mapping(address => uint256) maximum_deposits;
    // Vega asset ID => asset_source
    mapping(bytes32 => address) vega_asset_ids_to_source;
    // asset_source => Vega asset ID
    mapping(address => bytes32) asset_source_to_vega_asset_id;

    /// @param erc20_asset_pool Initial Asset Pool contract address
    constructor(address payable erc20_asset_pool) {
        erc20_asset_pool_address = erc20_asset_pool;
    }

    function multisig_control_address() internal view returns(address) {
      return ERC20_Asset_Pool(erc20_asset_pool_address).multisig_control_address();
    }


    /***************************FUNCTIONS*************************/
    /// @notice This function lists the given ERC20 token contract as valid for deposit to this bridge
    /// @param asset_source Contract address for given ERC20 token
    /// @param vega_asset_id Vega-generated asset ID for internal use in Vega Core
    /// @param lifetime_limit Initial lifetime deposit limit *RESTRICTION FEATURE*
    /// @param withdraw_threshold Amount at which the withdraw delay goes into effect *RESTRICTION FEATURE*
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @notice See MultisigControl for more about signatures
    /// @dev Emits Asset_Listed if successful
    function list_asset(address asset_source, bytes32 vega_asset_id, uint256 lifetime_limit, uint256 withdraw_threshold, uint256 nonce, bytes memory signatures) public override {
        require(!listed_tokens[asset_source], "asset already listed");
        bytes memory message = abi.encode(asset_source, vega_asset_id, lifetime_limit, withdraw_threshold, nonce, 'list_asset');
        require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
        listed_tokens[asset_source] = true;
        vega_asset_ids_to_source[vega_asset_id] = asset_source;
        asset_source_to_vega_asset_id[asset_source] = vega_asset_id;
        asset_deposit_lifetime_limit[asset_source] = lifetime_limit;
        withdraw_thresholds[asset_source] = withdraw_threshold;
        emit Asset_Listed(asset_source, vega_asset_id, nonce);
    }

    /// @notice This function removes from listing the given ERC20 token contract. This marks the token as invalid for deposit to this bridge
    /// @param asset_source Contract address for given ERC20 token
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @notice See MultisigControl for more about signatures
    /// @dev Emits Asset_Removed if successful
    function remove_asset(address asset_source, uint256 nonce, bytes memory signatures) public override {
        require(listed_tokens[asset_source], "asset not listed");
        bytes memory message = abi.encode(asset_source, nonce, 'remove_asset');
        require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
        listed_tokens[asset_source] = false;
        emit Asset_Removed(asset_source, nonce);
    }

    /// @notice This function sets the minimum allowable deposit for the given ERC20 token
    /// @param asset_source Contract address for given ERC20 token
    /// @param minimum_amount Minimum deposit amount
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @notice See MultisigControl for more about signatures
    /// @dev Emits Asset_Deposit_Minimum_Set if successful
    function set_deposit_minimum(address asset_source, uint256 minimum_amount, uint256 nonce, bytes memory signatures) public override{
        require(listed_tokens[asset_source], "asset not listed");
        bytes memory message = abi.encode(asset_source, minimum_amount, nonce, 'set_deposit_minimum');
        require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
        minimum_deposits[asset_source] = minimum_amount;
        emit Asset_Deposit_Minimum_Set(asset_source, minimum_amount, nonce);
    }

    /// @notice This function sets the maximum allowable deposit for the given ERC20 token
    /// @param asset_source Contract address for given ERC20 token
    /// @param maximum_amount Maximum deposit amount
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @notice See MultisigControl for more about signatures
    /// @dev Emits Asset_Deposit_Maximum_Set if successful
    function set_deposit_maximum(address asset_source, uint256 maximum_amount, uint256 nonce, bytes memory signatures) public override {
        require(listed_tokens[asset_source], "asset not listed");
        bytes memory message = abi.encode(asset_source, maximum_amount, nonce, 'set_deposit_maximum');
        require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
        maximum_deposits[asset_source] = maximum_amount;
        emit Asset_Deposit_Maximum_Set(asset_source, maximum_amount, nonce);
    }

    /************************RESTRICTIONS***************************/
    // user => asset_source => deposit total
    mapping(address => mapping(address => uint256)) user_lifetime_deposits;
    // asset_source => deposit_limit
    mapping(address => uint256) asset_deposit_lifetime_limit;
    uint256 public default_withdraw_delay = 432000;
    // asset_source => threshold
    mapping(address => uint256) withdraw_thresholds;
    bool public is_stopped;

    // depositor => is exempt from deposit limits
    mapping(address => bool) exempt_depositors;
    address exemption_lister;

    /// @notice This function sets the lifetime maximum deposit for a given asset
    /// @param asset_source Contract address for given ERC20 token
    /// @param lifetime_limit Deposit limit for a given ethereum address
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @dev asset must first be listed
    function set_lifetime_deposit_max(address asset_source, uint256 lifetime_limit, uint256 nonce, bytes calldata signatures) public override {
      require(listed_tokens[asset_source], "asset not listed");
      bytes memory message = abi.encode(asset_source, lifetime_limit, nonce, 'set_lifetime_deposit_max');
      require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
      asset_deposit_lifetime_limit[asset_source] = lifetime_limit;
    }

    /// @notice This view returns the lifetime deposit limit for the given asset
    /// @param asset_source Contract address for given ERC20 token
    /// @return Lifetime limit for the given asset
    function get_asset_deposit_limit(address asset_source) public override view returns(uint256) {
      return asset_deposit_lifetime_limit[asset_source];
    }

    /// @notice This function sets the withdraw delay for withdrawals over the per-asset set thresholds
    /// @param delay Amount of time to delay a withdrawal
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    function set_withdraw_delay(uint256 delay, uint256 nonce, bytes calldata signatures) public override {
      bytes memory message = abi.encode(delay, nonce, 'set_withdraw_delay');
      require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
      default_withdraw_delay = delay;
    }

    /// @notice This function sets the withdraw threshold above which the withdraw delay goes into effect
    /// @param asset_source Contract address for given ERC20 token
    /// @param threshold Withdraw size above which the withdraw delay goes into effect
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @dev asset must first be listed
    function set_withdraw_threshold(address asset_source, uint256 threshold, uint256 nonce, bytes calldata signatures) public override {
      require(listed_tokens[asset_source], "asset not listed");
      bytes memory message = abi.encode(asset_source, threshold, nonce, 'set_withdraw_threshold');
      require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
      withdraw_thresholds[asset_source] = threshold;
    }

    /// @notice This view returns the given token's withdraw threshold above which the withdraw delay goes into effect
    /// @param asset_source Contract address for given ERC20 token
    /// @return Withdraw threshold
    function get_withdraw_threshold(address asset_source) public override view returns(uint256) {
      return withdraw_thresholds[asset_source];
    }

    /// @notice This function triggers the global bridge stop that halts all withdrawals and deposits until it is resumed
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @dev bridge must not be stopped already
    /// @dev emits Bridge_Stopped if successful
    function global_stop(uint256 nonce, bytes calldata signatures) public override {
      require(!is_stopped, "bridge already stopped");
      bytes memory message = abi.encode(nonce, 'global_stop');
      require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
      is_stopped = true;
      emit Bridge_Stopped();
    }

    /// @notice This function resumes bridge operations from the stopped state
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @dev bridge must be stopped
    /// @dev emits Bridge_Resumed if successful
    function global_resume(uint256 nonce, bytes calldata signatures) public override {
      require(is_stopped, "bridge not stopped");
      bytes memory message = abi.encode(nonce, 'global_resume');
      require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
      is_stopped = false;
      emit Bridge_Resumed();
    }

    /// @notice this function allows MultisigControl to set the address that can exempt depositors from the deposit limits
    /// @notice this feature is specifically for liquidity and rewards providers
    /// @param lister The address that can exempt depositors
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @dev emits Exemption_Lister_Set if successful
    function set_exemption_lister(address lister, uint256 nonce, bytes calldata signatures) public override{
      bytes memory message = abi.encode(lister, nonce, 'set_exemption_lister');
      require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
      exemption_lister = lister;
      emit Exemption_Lister_Set(lister);
    }

    /// @notice this function allows the exemption_lister to exempt a depositor from the deposit limits
    /// @notice this feature is specifically for liquidity and rewards providers
    /// @param depositor The depositor to exempt from limits
    /// @dev emits Depositor_Exempted if successful
    function exempt_depositor(address depositor) public override {
      require(depositor != address(0), "cannot exempt zero address");
      require(!exempt_depositors[depositor], "depositor already exempt");
      require(msg.sender == exemption_lister || msg.sender == depositor, "unauthorized exemption lister");
      exempt_depositors[depositor] = true;
      emit Depositor_Exempted(depositor);
    }

    /// @notice this function allows the exemption_lister to revoke a depositor's exemption from deposit limits
    /// @notice this feature is specifically for liquidity and rewards providers
    /// @param depositor The depositor from which to revoke deposit exemptions
    /// @dev emits Depositor_Exemption_Revoked if successful
    function revoke_exempt_depositor(address depositor) public override {
      require(msg.sender == exemption_lister || msg.sender == depositor, "unauthorized exemption lister");
      require(exempt_depositors[depositor], "depositor not exempt");
      exempt_depositors[depositor] = false;
      emit Depositor_Exemption_Revoked(depositor);
    }

    /// @notice this view returns the address that can exempt depositors from deposit limits
    /// @return the address can exempt depositors from deposit limits
    function get_exemption_lister() public override view returns(address) {
      return exemption_lister;
    }

    /// @notice this view returns true if the given despoitor address has been exempted from deposit limits
    /// @param depositor The depositor to check
    /// @return true if depositor is exempt
    function is_exempt_depositor(address depositor) public override view returns(bool) {
      return exempt_depositors[depositor];
    }
    /***********************END RESTRICTIONS*************************/

    /// @notice This function withdrawals assets to the target Ethereum address
    /// @param asset_source Contract address for given ERC20 token
    /// @param amount Amount of ERC20 tokens to withdraw
    /// @param target Target Ethereum address to receive withdrawn ERC20 tokens
    /// @param creation Timestamp of when requestion was created *RESTRICTION FEATURE*
    /// @param nonce Vega-assigned single-use number that provides replay attack protection
    /// @param signatures Vega-supplied signature bundle of a validator-signed order
    /// @notice See MultisigControl for more about signatures
    /// @dev Emits Asset_Withdrawn if successful
    function withdraw_asset(address asset_source, uint256 amount, address target, uint256 creation, uint256 nonce, bytes memory signatures) public override{
        require(!is_stopped, "bridge stopped");
        require(withdraw_thresholds[asset_source] > amount || creation + default_withdraw_delay <= block.timestamp, "large withdraw is not old enough");
        bytes memory message = abi.encode(asset_source, amount, target, creation,  nonce, 'withdraw_asset');
        require(IMultisigControl(multisig_control_address()).verify_signatures(signatures, message, nonce), "bad signatures");
        ERC20_Asset_Pool(erc20_asset_pool_address).withdraw(asset_source, target, amount);
        emit Asset_Withdrawn(target, asset_source, amount, nonce);
    }


    /// @notice This function allows a user to deposit given ERC20 tokens into Vega
    /// @param asset_source Contract address for given ERC20 token
    /// @param amount Amount of tokens to be deposited into Vega
    /// @param vega_public_key Target Vega public key to be credited with this deposit
    /// @dev emits Asset_Deposited if successful
    /// @dev ERC20 approve function should be run before running this
    /// @notice ERC20 approve function should be run before running this
    function deposit_asset(address asset_source, uint256 amount, bytes32 vega_public_key) public override {
        require(!is_stopped, "bridge stopped");
        require(exempt_depositors[msg.sender] || user_lifetime_deposits[msg.sender][asset_source] + amount <= asset_deposit_lifetime_limit[asset_source], "deposit over lifetime limit");
        require(listed_tokens[asset_source], "asset not listed");
        //User must run approve before deposit
        require(maximum_deposits[asset_source] == 0 || amount <= maximum_deposits[asset_source], "deposit above maximum");
        require(amount >= minimum_deposits[asset_source], "deposit below minimum");
        require(IERC20(asset_source).transferFrom(msg.sender, erc20_asset_pool_address, amount), "transfer failed in deposit");
        user_lifetime_deposits[msg.sender][asset_source] += amount;
        emit Asset_Deposited(msg.sender, asset_source, amount, vega_public_key);
    }

    /***************************VIEWS*****************************/
    /// @notice This view returns true if the given ERC20 token contract has been listed valid for deposit
    /// @param asset_source Contract address for given ERC20 token
    /// @return True if asset is listed
    function is_asset_listed(address asset_source) public override view returns(bool){
        return listed_tokens[asset_source];
    }

    /// @notice This view returns minimum valid deposit
    /// @param asset_source Contract address for given ERC20 token
    /// @return Minimum valid deposit of given ERC20 token
    function get_deposit_minimum(address asset_source) public override view returns(uint256){
        return minimum_deposits[asset_source];
    }

    /// @notice This view returns maximum valid deposit
    /// @param asset_source Contract address for given ERC20 token
    /// @return Maximum valid deposit of given ERC20 token
    function get_deposit_maximum(address asset_source) public override view returns(uint256){
        return maximum_deposits[asset_source];
    }

    /// @return current multisig_control_address
    function get_multisig_control_address() public override view returns(address) {
        return multisig_control_address();
    }

    /// @param asset_source Contract address for given ERC20 token
    /// @return The assigned Vega Asset Id for given ERC20 token
    function get_vega_asset_id(address asset_source) public override view returns(bytes32){
        return asset_source_to_vega_asset_id[asset_source];
    }

    /// @param vega_asset_id Vega-assigned asset ID for which you want the ERC20 token address
    /// @return The ERC20 token contract address for a given Vega Asset Id
    function get_asset_source(bytes32 vega_asset_id) public override view returns(address){
        return vega_asset_ids_to_source[vega_asset_id];
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
