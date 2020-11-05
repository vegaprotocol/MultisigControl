//ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"
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


//////////////////////////////////////////////ROPSTEN
const HDWalletProvider = require("@truffle/hdwallet-provider");
let ropsten_infura = "https://ropsten.infura.io/v3/d98154612ecd408ca30d9756a9add9fd";
let mnemonic = "cherry manage trip absorb logic half number test shed logic purpose rifle";
let provider = new HDWalletProvider({
    mnemonic: {
        phrase: mnemonic
    },
    providerOrUrl: ropsten_infura
});

let web3_instance = new Web3(provider);


/////////////////////////////////////////////END ROPSTEN






//////////////////////////////////////////////LOCAL/GANACHE
/*
let provider = new Web3.providers.HttpProvider("http://localhost:8545");
let erc20_bridge_contract = contract(erc20_bridge_json, ropsten_bridge_address);
erc20_bridge_contract.setProvider(provider);

let erc20_token_contract = contract(erc20_token_json, ropsten_token_address);
erc20_token_contract.setProvider(provider);

*/
////////////////////////////////////////////END LOCAL/GANACHE
async function run_deposit(){
    let ropsten_bridge_address = "0xf6C9d3e937fb2dA4995272C1aC3f3D466B7c23fC";
    let ropsten_token_address = "0x308C71DE1FdA14db838555188211Fc87ef349272";

    let erc20_bridge_instance = new web3_instance.eth.Contract(erc20_bridge_json.abi, ropsten_bridge_address);
    let erc20_token_instance = new web3_instance.eth.Contract(erc20_token_json.abi, ropsten_token_address);





    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    console.log("Wallet Address");
    console.log(wallet_address);

    console.log("VUSD Balance Start: " + (await erc20_token_instance.methods.balanceOf(wallet_address).call()));
    console.log("Running Faucet...");
    //faucet
    await erc20_token_instance.methods.faucet().send({from: wallet_address});

    console.log("Faucet complete");
    let after_faucet_balance =  (await erc20_token_instance.methods.balanceOf(wallet_address).call());
    let to_deposit = after_faucet_balance.toString();
    console.log("VUSD Balance After Faucet: " + after_faucet_balance);

    //approve
    console.log("Approving Bridge as Spender...");
    await erc20_token_instance.methods.approve(ropsten_bridge_address, to_deposit).send({from: wallet_address});
    console.log("Bridge Approved");

    //deposit
    console.log("Depositing VUSD5")
    try {
        await erc20_bridge_instance.methods.deposit_asset(ropsten_token_address, 0, to_deposit, "0xbb791479154d7344dc2bc6f4580ee7b9435e41849257fe6eea6e623c0cbe7c8e").send({from: wallet_address});
    } catch (e) {
        console.log(e)
    }
    console.log("VUSD Deposited, have a  nice day...");
    //({from:eth_wallet})
}



run_deposit();
console.log('Press any key to exit');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));
