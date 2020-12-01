const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');
const HDWalletProvider = require("@truffle/hdwallet-provider");

let root_path =  '../ropsten_deploy_details/';

let is_ganache = true;
let net = "local/";
for(let arg_idx = 0; arg_idx < process.argv.length; arg_idx++){

    if(process.argv[arg_idx] === 'ropsten'){
        console.log("Ropsten detected");
        is_ganache = false;
    }

    if(process.argv[arg_idx] === '--vega'){
        net = process.argv[arg_idx + 1];

        switch(net){
            case "test":
                //TODO add file path
                break;
            case "stag":
                //TODO add file path
                break;
            case "dev":
                //TODO add file path
                break;
            default:
                throw ("Bad network choice, -network ropsten --vega [test|stag|dev]");
        }
    }
}
if(!is_ganache && net === "local/"){
    throw ("Bad network choice, truffle migrate --network ropsten --vega [test|stag|dev] OR truffle migrate");
}
root_path += net + "/";

let web3_instance;
if(is_ganache){
    web3_instance = new Web3("http://localhost:8545");
} else {
    let ropsten_infura = "https://ropsten.infura.io/v3/d98154612ecd408ca30d9756a9add9fd";

    web3_instance = new Web3(new HDWalletProvider({
        mnemonic: {
            phrase: "cherry manage trip absorb logic half number test shed logic purpose rifle"
        },
        providerOrUrl: ropsten_infura
    }));
}


//https://github.com/vegaprotocol/devops-infra/blob/master/ansible/roles/vegaserver/files/home/vega/eth-indexed.txt-d.vega.xyz

let multisig_control_abi = require(root_path+  "M.json");
let bridge_addresses = require(root_path + "bridge_addresses.json");

let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;

async function configure_signatures() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    let multisig_control_instance =
    //TODO cycle though all signer changed events and try remove signer

    //cycle through config file
    //add signer



    for(let contract in bridge_addresses){
        console.log(contract + "...")
        let token_instance = new web3_instance.eth.Contract(killable_abi, bridge_addresses[contract]);
        try {
            await token_instance.methods.kill().send({
                from:wallet_address,
                gasPrice:"150000000000"
            });
        }catch (e) {
            console.log(e)
        }
        console.log(contract + "... Done")
    }
    console.log("done");
}


configure_signatures();