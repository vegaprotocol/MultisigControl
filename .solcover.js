const fs = require("fs");
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  skipFiles: [
    'tests/Killable.sol', 
    'tests/Vega_Staking_Bridge.sol', 
    'tests/Ownable.sol',
    'tests/Migrations.sol',
    'tests/ERC20Detailed.sol',
    'tests/ERC20.sol',
    'tests/Bulk_Deposit.sol',
    'tests/Base_Faucet_Token.sol',
    'tests/IERC20.sol',
    'tests/IERC20_Bridge_Logic.sol',
    'tests/IStake.sol',
    'tests/SafeMath.sol',
    'SafeMath.sol'
  ],
  providerOptions: {
    mnemonic: mnemonic,
    network_id: "*"
  }
};