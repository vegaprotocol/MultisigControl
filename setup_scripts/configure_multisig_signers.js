const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');
const HDWalletProvider = require("@truffle/hdwallet-provider");


let root_path =  '../ropsten_deploy_details/';

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
                throw ("Bad network choice, -network ropsten --vega [test|stag|dev]");
        }
    }
}
if(net === "local"){
    throw("this script is not intended for local without modification");
}
if(!is_ganache && net === "local"){
    throw ("Bad network choice, truffle migrate --network ropsten --vega [test|stag|dev] OR truffle migrate");
}
root_path += net + "/";

let signers = require("./multisig_signers_" + net + ".json");

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

let multisig_control_abi = require(root_path + "MultisigControl_ABI.json");
let bridge_addresses = require(root_path + "bridge_addresses.json");

let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;

async function configure_signatures() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    let multisig_control_instance =  new web3_instance.eth.Contract(multisig_control_abi, bridge_addresses.multisig_control);

    let signer_events = await multisig_control_instance.getPastEvents("SignerAdded", {
        fromBlock: 0,
        toBlock: "latest"
    });
    let signer_admin_events = await multisig_control_instance.getPastEvents("SignerAdded_Admin", {
        fromBlock: 0,
        toBlock: "latest"
    });

    let known_signers = signer_events.map(event => { return event.returnValues.new_signer; })
        .concat(signer_admin_events.map(event => { return event.returnValues.new_signer; }))
    console.log("Known Past Signers:");
    console.log(known_signers);
    for(let known_signer_idx = 0; known_signer_idx < known_signers.length; known_signer_idx++){
        let this_signer = known_signers[known_signer_idx];
        console.log("Removing past signer: " + this_signer);
        try {
            await multisig_control_instance.methods.remove_signer_admin(this_signer).send({
                from:wallet_address,
                gasPrice:"150000000000"
            });
        } catch (e) {
            //this is usually because the signer has already been removed, but I'm to lazy to check for that at the moment TODO check for non "already removed" errors here
        }
    }

    for(let new_signer_idx = 0; new_signer_idx < signers.length; new_signer_idx++){
        console.log("Adding new signer: " + signers[new_signer_idx]);
        await multisig_control_instance.methods.add_signer_admin(signers[new_signer_idx]).send({
            from:wallet_address,
            gasPrice:"150000000000"
        });
    }

    console.log("done");
}


configure_signatures();