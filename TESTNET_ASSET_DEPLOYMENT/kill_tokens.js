const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');
const HDWalletProvider = require("@truffle/hdwallet-provider");
let root_path =  "../ropsten_deploy_details/";

let is_ganache = true;
let net = "local";
for(let arg_idx = 0; arg_idx < process.argv.length; arg_idx++){

    if(process.argv[arg_idx] === 'ropsten'){
        console.log("Ropsten detected");
        is_ganache = false;
    }

    if(process.argv[arg_idx] === '--vega'){
        net = process.argv[arg_idx + 1];

        switch(net){
            case "test":
                break;
            case "stag":
                break;
            case "dev":
                break;
            default:
                throw ("Bad network choice, -network ropsen --vega [test|stag|dev]");
        }
    }
}
if(!is_ganache && net === "local"){
    throw ("Bad network choice, truffle migrate --network ropsen --vega [test|stag|dev] OR truffle migrate");
}
root_path += net + "/";

let web3_instance;
if(is_ganache){
    console.log("using ganache...")
    web3_instance = new Web3("http://localhost:8545");
} else {
    console.log("using ropsten...")
    let ropsten_infura = "https://ropsten.infura.io/v3/d98154612ecd408ca30d9756a9add9fd";

    web3_instance = new Web3(new HDWalletProvider({
        mnemonic: {
            phrase: "cherry manage trip absorb logic half number test shed logic purpose rifle"
        },
        providerOrUrl: ropsten_infura
    }));
}


let killable_abi = require(root_path+  "Killable_ABI.json");
let token_addresses = require(root_path + "token_addresses.json");


let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;
async function kill_tokens() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();

    console.log("killing tokens")
    for(let contract in token_addresses){
        console.log(contract + "...")
        let token_instance = new web3_instance.eth.Contract(killable_abi, token_addresses[contract]);
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