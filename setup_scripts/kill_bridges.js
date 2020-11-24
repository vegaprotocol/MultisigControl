let killable_abi = require("../ropsten_deploy_details/killable_abi.json");

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


let bridge_addresses = require("../ropsten_deploy_details/bridge_addresses.json");


let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;

async function kill_bridges() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();

    console.log("killing wallets")
    for(let contract in bridge_addresses){
        console.log(contract + "...")
        let token_instance = new web3_instance.eth.Contract(killable_abi, bridge_addresses[contract]);
        try {
            await token_instance.methods.kill().send({
                from:wallet_address,
                gasPrice:"150000000000"
            });
        }catch (e) {

        }
        console.log(contract + "... Done")
    }
    console.log("done");
}


kill_bridges()