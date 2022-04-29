---
id: version-undefined-IERC20_Bridge_Logic
title: IERC20_Bridge_Logic
original_id: IERC20_Bridge_Logic
---

# ERC20 Bridge Logic Interface (IERC20_Bridge_Logic.sol)

View Source: [contracts/tests/IERC20_Bridge_Logic.sol](../contracts/tests/IERC20_Bridge_Logic.sol)

**IERC20_Bridge_Logic**

Implementations of this interface are used by Vega network users to deposit and withdraw ERC20 tokens to/from Vega.

## Asset_Withdrawn

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| user_address | address |  | 
| asset_source | address |  | 
| amount | uint256 |  | 
| nonce | uint256 |  | 

## Asset_Deposited

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| user_address | address |  | 
| asset_source | address |  | 
| amount | uint256 |  | 
| vega_public_key | bytes32 |  | 

## Asset_Deposit_Minimum_Set

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address |  | 
| new_minimum | uint256 |  | 
| nonce | uint256 |  | 

## Asset_Deposit_Maximum_Set

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address |  | 
| new_maximum | uint256 |  | 
| nonce | uint256 |  | 

## Asset_Listed

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address |  | 
| vega_asset_id | bytes32 |  | 
| nonce | uint256 |  | 

## Asset_Removed

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address |  | 
| nonce | uint256 |  | 

## Functions

- [list_asset(address asset_source, bytes32 vega_asset_id, uint256 nonce, bytes signatures)](#list_asset)
- [remove_asset(address asset_source, uint256 nonce, bytes signatures)](#remove_asset)
- [set_deposit_minimum(address asset_source, uint256 minimum_amount, uint256 nonce, bytes signatures)](#set_deposit_minimum)
- [set_deposit_maximum(address asset_source, uint256 maximum_amount, uint256 nonce, bytes signatures)](#set_deposit_maximum)
- [withdraw_asset(address asset_source, uint256 amount, uint256 expiry, address target, uint256 nonce, bytes signatures)](#withdraw_asset)
- [deposit_asset(address asset_source, uint256 amount, bytes32 vega_public_key)](#deposit_asset)
- [is_asset_listed(address asset_source)](#is_asset_listed)
- [get_deposit_minimum(address asset_source)](#get_deposit_minimum)
- [get_deposit_maximum(address asset_source)](#get_deposit_maximum)
- [get_multisig_control_address()](#get_multisig_control_address)
- [get_vega_asset_id(address asset_source)](#get_vega_asset_id)
- [get_asset_source(bytes32 vega_asset_id)](#get_asset_source)

### list_asset

This function lists the given ERC20 token contract as valid for deposit to this bridgeMUST emit Asset_Listed if successful

```js
function list_asset(address asset_source, bytes32 vega_asset_id, uint256 nonce, bytes signatures) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 
| vega_asset_id | bytes32 | Vega-generated asset ID for internal use in Vega Core | 
| nonce | uint256 | Vega-assigned single-use number that provides replay attack protection | 
| signatures | bytes | Vega-supplied signature bundle of a validator-signed order | 

### remove_asset

This function removes from listing the given ERC20 token contract. This marks the token as valid for deposit to this bridgeMUST emit Asset_Removed if successful

```js
function remove_asset(address asset_source, uint256 nonce, bytes signatures) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 
| nonce | uint256 | Vega-assigned single-use number that provides replay attack protection | 
| signatures | bytes | Vega-supplied signature bundle of a validator-signed order | 

### set_deposit_minimum

This function sets the minimum allowable deposit for the given ERC20 tokenMUST emit Asset_Deposit_Minimum_Set if successful

```js
function set_deposit_minimum(address asset_source, uint256 minimum_amount, uint256 nonce, bytes signatures) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 
| minimum_amount | uint256 | Minimum deposit amount | 
| nonce | uint256 | Vega-assigned single-use number that provides replay attack protection | 
| signatures | bytes | Vega-supplied signature bundle of a validator-signed order | 

### set_deposit_maximum

This function sets the maximum allowable deposit for the given ERC20 tokenMUST emit Asset_Deposit_Maximum_Set if successful

```js
function set_deposit_maximum(address asset_source, uint256 maximum_amount, uint256 nonce, bytes signatures) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 
| maximum_amount | uint256 | Maximum deposit amount | 
| nonce | uint256 | Vega-assigned single-use number that provides replay attack protection | 
| signatures | bytes | Vega-supplied signature bundle of a validator-signed order | 

### withdraw_asset

This function sets the maximum allowable deposit for the given ERC20 tokenMUST emit Asset_Withdrawn if successful

```js
function withdraw_asset(address asset_source, uint256 amount, uint256 expiry, address target, uint256 nonce, bytes signatures) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 
| amount | uint256 | Amount of ERC20 tokens to withdraw | 
| expiry | uint256 | Vega-assigned timestamp of withdrawal order expiration | 
| target | address | Target Ethereum address to receive withdrawn ERC20 tokens | 
| nonce | uint256 | Vega-assigned single-use number that provides replay attack protection | 
| signatures | bytes | Vega-supplied signature bundle of a validator-signed order | 

### deposit_asset

This function allows a user to deposit given ERC20 tokens into VegaMUST emit Asset_Deposited if successful

```js
function deposit_asset(address asset_source, uint256 amount, bytes32 vega_public_key) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 
| amount | uint256 | Amount of tokens to be deposited into Vega | 
| vega_public_key | bytes32 | Target vega public key to be credited with this deposit | 

### is_asset_listed

This view returns true if the given ERC20 token contract has been listed valid for deposit

```js
function is_asset_listed(address asset_source) public view
returns(bool)
```

**Returns**

True if asset is listed

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 

### get_deposit_minimum

This view returns minimum valid deposit

```js
function get_deposit_minimum(address asset_source) public view
returns(uint256)
```

**Returns**

Minimum valid deposit of given ERC20 token

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 

### get_deposit_maximum

This view returns maximum valid deposit

```js
function get_deposit_maximum(address asset_source) public view
returns(uint256)
```

**Returns**

Maximum valid deposit of given ERC20 token

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 

### get_multisig_control_address

```js
function get_multisig_control_address() public view
returns(address)
```

**Returns**

current multisig_control_address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### get_vega_asset_id

```js
function get_vega_asset_id(address asset_source) public view
returns(bytes32)
```

**Returns**

The assigned Vega Asset Id for given ERC20 token

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| asset_source | address | Contract address for given ERC20 token | 

### get_asset_source

```js
function get_asset_source(bytes32 vega_asset_id) public view
returns(address)
```

**Returns**

The ERC20 token contract address for a given Vega Asset Id

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| vega_asset_id | bytes32 | Vega-assigned asset ID for which you want the ERC20 token address | 

