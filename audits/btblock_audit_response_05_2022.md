# Audit response for btblock audit (May 2022)

## BtBlock

### btblock 1
In ETH_Bridge_Logic.sol line 21, the variable `vega_asset_id` is not initialized and never set in the code, but it is used.

Solution - No action. It's value is used in the `get_vega_asset_id()` function to fetch the asset id for ETH.

### btblock 2
Some of the address assignments lack zero checks:
- multisig_control_address in ERC20_Asset_Pool.sol line 24
- erc20_asset_pool_address ERC20_Bridge_Logic_Restricted.sol line 25
- target in ETH_Asset_Pool.sol line 65
- ETH_asset_pool_address in ETH_Bridge_Logic.sol line 25

Solution - Zero address checks added for all.

### btblock 3
Solidity `0.8.8` is used, which has known bugs - https://docs.soliditylang.org/en/latest/bugs.html

Solution - Upgraded solidity compiler version to the latest one (`0.8.13`)

### btblock 4
There are two issues in verify_signatures function with the logic that checks for duplicates:
1. If there are not enough signatures for the message on the first call, when performing a second call, signatures from the first one would be ignored.
2. It is not recommended to use storage to save temporary data as it is the most expensive operation in solidity.

Here is an example of how it can be fixed:
Add a map with a list of ids assigned to each signer.

    mapping(address => uint8) signers;
    mapping(uint8 => address) ids;

Ids should be in range 1..255.

When adding a signer, check that id is not used in ids map.
When deleting a signer, set id in signers to 0 and address in ids to address(0)

In verify_signatures create memory array for used ids:
bool[] memory used = new bool[](256);

Check that signer exists and is not duplicated:
    uint8 id = signers[recovered_address];

    if (id > 0 && !used[id]) {
        used[id] = true;
        sig_count++;
    }

because of additional ids map, the operation of adding a new signer would be more expensive, but more frequently used verify_signatures would cost less

Solution - Implemented and tested the recommended fix


### btblock 5
No issue found in Pools contracts. However, for the ERC20_Bridge_Logic_Restricted contract:
1. What is the use of user_lifetime_deposits as it can be ignored if user does exempt_depositor() ?

v - It's a limit in the max amount that can be deposited per users. Users can opt out the limit explicitly by calling the exempt function.

2. How are withdraw requests processed in Vega network? I assume that assets are locked when request is created. In this case it is required to add expiration parameter in withdraw_asset() so there is a limit how long assets will be locked if transaction is not performed. As alternative, it is possible to consume the nonce used in withdraw request by direct call of verify_signatures() but I recommend to go with expiration as it would be more clear to a user.

v - Why do you need expiration? The funds are locked on the contract forever once deposited until the vega network release the funds via the signatures from the validators from vega

b - Vega network awaits withdrawal event, but if withdraw_asset transaction is not performed, the event would not occur. I don't know the exact logic inside Vega network - whether it blocks any functionality or can be ignored. Expiration would help if there something blocked.

v - No worries nothing is blocked. It’s a one of for the vega network, if they don't withdraw the funds then that’s on them


Solution - No action required


## Others 


### Vega 1
Paul raised checking balance of deposited assets on the bridge contracts which right now is private.
Other variables are also private, e.g., erc20_asset_pool_address in ERC20_Bridge_Logic_Restricted

Solution - deposited amounts will need to be found via the events or on the Vega side as the ethereum side only works like a pool.