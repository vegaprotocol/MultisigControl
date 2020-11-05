
const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
let erc20_bridge_json  = require(path.join(__dirname, 'build/contracts/Vega_Bridge_ERC20.json'));
let erc20_token_json = require(path.join(__dirname, 'build/contracts/VUSD_TEST.json'));
const ethUtil = require('ethereumjs-util');

let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;

let provider = new Web3.providers.HttpProvider("http://ganache:8545");


let erc20_bridge_contract = contract(erc20_bridge_json);
erc20_bridge_contract.setProvider(provider);

let erc20_token_contract = contract(erc20_token_json);
erc20_token_contract.setProvider(provider);


async function run_deposit(){

    let to_deposit = "1000000000000000000000";

    let erc20_bridge_instance = await erc20_bridge_contract.deployed();
    let erc20_token_instance = await erc20_token_contract.deployed();
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    console.log("VUSD Balance Start: " + await erc20_token_instance.balanceOf(wallet_address));
    console.log("Running Faucet...")
    //faucet
    await erc20_token_instance.faucet({from: wallet_address});

    console.log("Faucet complete");
    console.log("VUSD Balance After Faucet: " + await erc20_token_instance.balanceOf(wallet_address));

    //approve
    console.log("Approving Bridge as Spender...");
    await erc20_token_instance.approve(erc20_bridge_contract.address, to_deposit, {from: wallet_address});
    console.log("Bridge Approved");

    //whitelist
    console.log("Whitelisting Asset...");
    try{
        await erc20_bridge_instance.whitelist_asset_admin(erc20_token_contract.address, 0, "0x11e09c9e87849d7c2d9df126a9057f3b0ebb94e107dfb73f9451854efeeb27dd", {from: wallet_address});
    } catch (e) {
        console.log("may already be whitelisted...");
    }

    console.log("Whitelist Complete")

    //deposit
    console.log("Depositing VUSD")
    await erc20_bridge_instance.deposit_asset(erc20_token_contract.address, 0, to_deposit, "0xe878cd04bd1cd9d3facb9f0eaa4df3519d0cc57b7df0436526d1ba6857449403", {from: wallet_address});
    console.log("VUSD Deposited, have a  nice day...");
    //({from:eth_wallet})
}



run_deposit();
console.log('Press any key to exit');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));
