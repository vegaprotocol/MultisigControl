let killable_abi = require("./abis_and_addresses/killable_abi.json");

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
async function kill_tokens() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();

    console.log("killing tokens")
    for(let contract in token_contracts){
        console.log(contract + "...")
        let token_instance = new web3_instance.eth.Contract(killable_abi, token_contracts[contract]);
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


kill_tokens()