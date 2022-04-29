---
id: version-undefined-Base_Faucet_Token
title: Base_Faucet_Token
original_id: Base_Faucet_Token
---

# Base_Faucet_Token.sol

View Source: [contracts/tests/Base_Faucet_Token.sol](../contracts/tests/Base_Faucet_Token.sol)

**↗ Extends: [ERC20Detailed](ERC20Detailed.md), [Ownable](Ownable.md), [ERC20](ERC20.md), [Killable](Killable.md)**

**Base_Faucet_Token**

## Contract Members
**Constants & Variables**

```js
uint256 internal _faucet_amount;
```
---

## Functions

- [(string _name, string _symbol, uint8 _decimals, uint256 total_supply_whole_tokens, uint256 faucet_amount)](#base_faucet_tokensol)
- [faucet()](#faucet)
- [issue(address account, uint256 value)](#issue)
- [admin_deposit_single(uint256 amount, address bridge_address, bytes32 vega_public_key)](#admin_deposit_single)
- [admin_deposit_bulk(uint256 amount, address bridge_address, bytes32[] vega_public_keys)](#admin_deposit_bulk)
- [admin_stake_bulk(uint256 amount, address staking_bridge_address, bytes32[] vega_public_keys)](#admin_stake_bulk)

### 

```js
function (string _name, string _symbol, uint8 _decimals, uint256 total_supply_whole_tokens, uint256 faucet_amount) public nonpayable ERC20Detailed 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string |  | 
| _symbol | string |  | 
| _decimals | uint8 |  | 
| total_supply_whole_tokens | uint256 |  | 
| faucet_amount | uint256 |  | 

### faucet

```js
function faucet() public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### issue

```js
function issue(address account, uint256 value) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 
| value | uint256 |  | 

### admin_deposit_single

```js
function admin_deposit_single(uint256 amount, address bridge_address, bytes32 vega_public_key) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 |  | 
| bridge_address | address |  | 
| vega_public_key | bytes32 |  | 

### admin_deposit_bulk

```js
function admin_deposit_bulk(uint256 amount, address bridge_address, bytes32[] vega_public_keys) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 |  | 
| bridge_address | address |  | 
| vega_public_keys | bytes32[] |  | 

### admin_stake_bulk

```js
function admin_stake_bulk(uint256 amount, address staking_bridge_address, bytes32[] vega_public_keys) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 |  | 
| staking_bridge_address | address |  | 
| vega_public_keys | bytes32[] |  | 

