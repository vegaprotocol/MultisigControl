---
id: version-undefined-ERC20Detailed
title: ERC20Detailed
original_id: ERC20Detailed
---

# ERC20Detailed.sol

View Source: [contracts/tests/ERC20Detailed.sol](../contracts/tests/ERC20Detailed.sol)

**↗ Extends: [IERC20](IERC20.md)**
**↘ Derived Contracts: [Base_Faucet_Token](Base_Faucet_Token.md)**

**ERC20Detailed**

Optional functions from the ERC20 standard.

## Contract Members
**Constants & Variables**

```js
string private _name;
```
---

```js
string private _symbol;
```
---

```js
uint8 private _decimals;
```
---

## Functions

- [(string __name, string __symbol, uint8 __decimals)](#erc20detailedsol)
- [name()](#name)
- [symbol()](#symbol)
- [decimals()](#decimals)

### 

Sets the values for `name`, `symbol`, and `decimals`. All three of
 these values are immutable: they can only be set once during
 construction.

```js
function (string __name, string __symbol, uint8 __decimals) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| __name | string |  | 
| __symbol | string |  | 
| __decimals | uint8 |  | 

### name

Returns the name of the token.

```js
function name() public view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### symbol

Returns the symbol of the token, usually a shorter version of the
 name.

```js
function symbol() public view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### decimals

Returns the number of decimals used to get its user representation.
 For example, if `decimals` equals `2`, a balance of `505` tokens should
 be displayed to a user as `5,05` (`505 / 10 ** 2`).
 Tokens usually opt for a value of 18, imitating the relationship between
 Ether and Wei.
 NOTE: This information is only used for _display_ purposes: it in
 no way affects any of the arithmetic of the contract, including
 {IERC20-balanceOf} and {IERC20-transfer}.

```js
function decimals() public view
returns(uint8)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

