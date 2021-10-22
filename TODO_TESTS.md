
# Restricted function tests
set_withdraw_threshold(bridge_logic_instance, withdraw_threshold, from_address) -> get_withdraw_threshold

* for withdrawal, time since bundle creation <= delay period
* for withdrawal, if withdrawal amount > withdrawal delay threshold (threshold is how much the withdrawal has to be before the delay is applied), revert
* get_withdraw_threshold for asset source should return correct threshold set using set_withdraw_threshold throws asset not listed
* deposit asset should revert if total deposited by user is > maximum lifetime deposit
* deposit asset should revert if total deposited to receiver address is > maximum lifetime deposit
* withdraw asset should revert if large withdraw is not old enough
