let bridge_abi = require("./abis_and_addresses/Vega_Bridge_ERC20.js");

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


let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;
async function get_events() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    let bridge_address = "0xf6C9d3e937fb2dA4995272C1aC3f3D466B7c23fC";
    let bridge_instance = new web3_instance.eth.Contract(bridge_abi, bridge_address);

    let events = await bridge_instance.getPastEvents("Asset_Deposited",{
        fromBlock: 9108685,
        toBlock: 'latest',
        filter: { "user_address": token_contracts.mass_dump_address}

    });

    console.log(events)


}


get_events()