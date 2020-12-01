
let spam_faucet_abi = require("./abis_and_addresses/spam_faucet_abi.json");

const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');


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


let token_contracts = require("./token_contracts");
let bot_configs = require("./bot_configs");

let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;
async function reload_bots() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();

    let bot_faucet_address = "0xD1F0979B9D5A18284fA661140748d46e453d3942";
    let bridge_address = "0xf6C9d3e937fb2dA4995272C1aC3f3D466B7c23fC";

    let spam_faucet_instance = new web3_instance.eth.Contract(spam_faucet_abi, bot_faucet_address);

    for(let bot_idx = 0; bot_idx < bot_configs.length; bot_idx++){
        spam_faucet_instance.methods.spam(
            bot_configs[bot_idx].settlementEthereumContractAddress,
            500,
            bridge_address,
            "0x" + bot_configs[bot_idx].pubKey,
        ).send({from: wallet_address});
    }



}


reload_bots()