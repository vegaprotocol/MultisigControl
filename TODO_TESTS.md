
# Restricted function tests
global_stop(bridge_logic_instance, from_address)
global_resume(bridge_logic_instance, from_address)
set_lifetime_deposit_max(bridge_logic_instance, lifetime_limit) -> get_asset_deposit_limit
set_withdraw_delay(bridge_logic_instance, delay) -> default_withdraw_delay
set_withdraw_threshold(bridge_logic_instance, withdraw_threshold)) -> get_withdraw_threshold

* set_lifetime_deposit_max throws asset not listed
* set_withdraw_delay can be called via multisig control
* for withdrawal, time since bundle creation <= delay period
* for withdrawal, if withdrawal amount > withdrawal delay threshold (threshold is how much the withdrawal has to be before the delay is applied), revert
* get_asset_deposit_limit for asset source should return correct limit set
* get_asset_deposit_limit for non existing asset returns 0
* get_withdraw_threshold for asset source should return correct threshold set using set_withdraw_threshold throws asset not listed
* deposit asset should revert when is_stopped
* deposit asset should revert if total deposited by user is > maximum lifetime deposit
* deposit asset should revert if total deposited to receiver address is > maximum lifetime deposit
* withdraw asset should revert when is_stopped
* withdraw asset should revert if large withdraw is not old enough
