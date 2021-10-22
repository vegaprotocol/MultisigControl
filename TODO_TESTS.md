
# Replicate all tests for ETH_Asset_Pool and ETH_Bridge_Logic

# ERC20_Asset_Pool.sol (done)
* contract should be deployed correctly with valid parameters
* set_bridge_address should only be callable by ?
* set_bridge_address should trigger bad signatures
* set_bridge_address should emit correct event and parameters
* set_bridge_address with invalid function parameters should fail or trigger bad signatures
* set_multisig_control should only be callable by ?
* set_multisig_control should trigger bad signatures
* set_multisig_control should emit correct event and parameters even if amount withdrawn is 0
* set_multisig_control with invalid function parameters should fail or trigger bad signatures
* withdraw should trigger msg.sender not authorized bridge
* withdraw should transfer correct amount to function caller 


# ERC20_Bridge_Logic.sol (done)
* contract should be deployed correctly with valid parameters
* list_asset should only be callable by ?
* remove_asset should trigger asset not listed
* remove_asset should trigger bad signatures
* remove_asset should only be callable by?
* remove_asset should update listed_tokens[asset_source] mapping
* remove_asset should fail with invalid function parameters, e.g., address(0)
* set_deposit_minimum should trigger asset not listed
* set_deposit_minimum should fail with invalid function parameters
* set_deposit_minimum should trigger bad signatures
* set_deposit_minimum should update minimum_deposits[asset_source] mapping
* set_deposit_maximum should trigger asset not listed
* set_deposit_maximum should trigger bad signatures
* set_deposit_maximum should update maximum_deposits[asset_source] mapping
* set_deposit_maximum should fail with invalid function parameters
* withdraw_asset should trigger bad signatures
* withdraw_asset should trigger token didn't transfer, rejected by asset pool.
* withaw_asset should trigger correct event and params
* withdraw_asset should fail if deposit is insufficient (and/or contract balance)
* deposit_asset should trigger asset not listed
* deposit_asset should trigger deposit above maximum
* deposit_asset should trigger deposit below minimum
* deposit_asset should trigger transfer failed in deposit
* deposit_asset should emit correct event and parameters
* is_asset_listed should return true if listed
* is_asset_listed should return false if not listed
* get_deposit_minimum should return minimum deposit for asset if set
* get_deposit_maximum should return maximum deposit for asset if set 
* get_multisig_control_address should not return address(0)
* get_vega_asset_id should return asset id for asset if set
* get_asset_source should return asset info/source if set


# Restricted function tests
* set_lifetime_deposit_max throws asset not listed
* set_withdraw_delay
* set_withdraw_delay can be changed via multisig control
* for withdrawal, time since bundle creation <= delay period
* for withdrawal, if withdrawal amount > withdrawal delay threshold, revert
* get_asset_deposit_limit for asset source should return correct limit set
* get_asset_deposit_limit for non existing asset returns 0
* get_withdraw_threshold for asset source should return correct threshold set using set_withdraw_threshold throws asset not listed
* global_stop should set is_stopped to true and emit correct event
* global_stop throws bridge already stopped
* deposit asset should revert when is_stopped
* deposit asset should revert if total deposited by user is > maximum lifetime deposit
* deposit asset should revert if total deposited to receiver address is > maximum lifetime deposit
* withdraw asset should revert when is_stopped
* withdraw asset should revert if large withdraw is not old enough
* global_resume should set is_stopped to false and emit correct event
* global_resume throws bridge not stopped
