---
id: version-undefined-Migrations
title: Migrations
original_id: Migrations
---

# Migrations.sol

View Source: [contracts/tests/Migrations.sol](../contracts/tests/Migrations.sol)

**Migrations**

## Contract Members
**Constants & Variables**

```js
address public owner;
```
---

```js
uint256 public last_completed_migration;
```
---

## Modifiers

- [restricted](#restricted)

### restricted

```js
modifier restricted() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [()](#migrationssol)
- [setCompleted(uint256 completed)](#setcompleted)

### 

```js
function () public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setCompleted

```js
function setCompleted(uint256 completed) public nonpayable restricted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| completed | uint256 |  | 

