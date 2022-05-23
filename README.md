# MultisigControl
This repository contains the Ethereum side of the Ethereum bridge to Vega.

## Basic structure
The bridge is comprised of a smart contract per asset class, and a generic asset pool. For example, when a user wants to deposit collateral in to a Vega network, they deposit an approved ERC20 token to the ERC20 bridge contract for the appropriate network. This is held in the asset pool contract, and the user's collateral is reflected in the Vega network:
![Deposit process](./docs/diagram-deposit.png)

For a more specific walkthrough, and find the ABIs & addresses for the Vega testnet, see [Public_Test_Bridge_Tools](https://github.com/vegaprotocol/Public_Test_Bridge_Tools).

### Withdrawal
Withdrawal is a slightly more complex process, as it requires gathering a signed multisig bundle from the validators on that Vega network, which the user then submits to the ERC20 bridge. This extra step is required so that the network can verify that the collateral exists in the network and is not allocated to the user's margin account.

![Withdrawal process](./docs/diagram-withdraw.png)

## Upgrading bridge contract for a running Vega network

As the asset pool is a separate contract, it's possible to update the ERC20 bridge contract for a running network without impacting the collateral held for users of the network. The process is outlined below, and requires a user to propose a governance action on Vega, before submitting a multisig bundle to the asset pool contract.

![Upgrade process](./docs/diagram-upgrade.png)

See below for instructions on how to complete step 1.

# Structure

![Upgrade process](./docs/sol2uml.png)

## Local Ganache Deployment
Terminal 1:

1. `npm install`
1. `npm run ganache` - this will start ganache-cli with the mnemonic from .secret


Terminal 2:

1. `truffle migrate` This deploys MultisigControl, Asset Pool, and 2 bridge logic contracts
1. `truffle build`
1. `truffle migrate` This deploys the bridges according to `migrations/2_contract_launch.js` onto ganache

All addresses, ABIs, and smart contract files will be available in `./ropsten_deploy_details/local`

## Run Tests Locally
Terminal 1:

1. `npm install`
1. `npm run ganache` - this will start ganache-cli with the mnemonic from .secret


Terminal 2:

1. `truffle migrate` This deploys MultisigControl, Asset Pool, and 2 bridge logic contracts
1. `truffle build`
1. `truffle test` This tests the bridges on local ganache



## Code Coverage Checks
1. `truffle run coverage`

## Prettier
1. `npx prettier -w contracts/`

# See Also

* https://github.com/vegaprotocol/Public_Test_Bridge_Tools
* https://vega.xyz
* https://docs.testnet.vega.xyz

# [License](./LICENSE)
MIT
