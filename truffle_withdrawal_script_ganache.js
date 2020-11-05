//ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"
const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path'),
    crypto          = require("crypto"),
    abi             = require('ethereumjs-abi');
let Wallet = require('ethereumjs-wallet');
let erc20_bridge_json  = require(path.join(__dirname, 'build/contracts/Vega_Bridge_ERC20.json'));
let erc20_token_json = require(path.join(__dirname, 'build/contracts/VUSD_TEST.json'));
let multisig_control_json = require(path.join(__dirname, 'build/contracts/MultisigControl.json'));
const ethUtil = require('ethereumjs-util');

let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;


let validator_private_keys =
    {
        "0xa3e6cceb9e110899c4fd57b0b9c06e775b2fd151":Buffer.from("19b5ba06a6643761dd87e0786c740acffed35b5879c90c7c3b269e03c3afec72",'hex'),
        //"0xb89a165ea8b619c14312db316baaa80d2a98b493":Buffer.from("adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b",'hex'),
    };


//ganache-cli -m "sentence find kit hood will omit awake prize leave bid nation crawl"
//Validator Mnemonic: sentence find kit hood will omit awake prize leave bid nation crawl
let validator_mnemonic = "sentence find kit hood will omit awake prize leave bid nation crawl";

let validator_private_key = "0x19b5ba06a6643761dd87e0786c740acffed35b5879c90c7c3b269e03c3afec72";
let validator_public_address = "0xa3e6cceb9e110899c4fd57b0b9c06e775b2fd151";

let provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");

let erc20_bridge_contract = contract(erc20_bridge_json);
erc20_bridge_contract.setProvider(provider);

let erc20_token_contract = contract(erc20_token_json);
erc20_token_contract.setProvider(provider);

let multisig_control_contract = contract(multisig_control_json);
multisig_control_contract.setProvider(provider);

function get_message_to_sign(param_types, params, nonce, function_name, sender){
    //generate nonce

    params.push(nonce);
    param_types.push("uint256");
    params.push(function_name);
    param_types.push("string");
    //var encoded_a = abi.rawEncode([ "address","uint256", "string"], [ wallet2, nonce, "add_signer" ]);
    let encoded_a = abi.rawEncode(param_types, params);
    //let encoded = abi.rawEncode(["bytes", "address"], [encoded_a, wallet1]);
    let final_encoded = abi.rawEncode(["bytes", "address"], [encoded_a, sender]);

    return final_encoded;
}


async function run_withdrawal(){



    let erc20_bridge_instance = await erc20_bridge_contract.deployed();
    let erc20_token_instance = await erc20_token_contract.deployed();
    let multisig_control_instance = await multisig_control_contract.deployed();

    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();

    console.log("Wallet Address");
    console.log(wallet_address);

    console.log("VUSD Balance Start: " + await erc20_token_instance.balanceOf(wallet_address));
    console.log("Running Faucet...");
    //faucet
    await erc20_token_instance.faucet({from: wallet_address});

    console.log("Faucet complete");
    let amount_to_withdraw = await erc20_token_instance.balanceOf(wallet_address);
    console.log("VUSD Balance After Faucet: " + amount_to_withdraw);

    //approve
    console.log("Approving Bridge as Spender...");
    await erc20_token_instance.approve(erc20_bridge_contract.address, amount_to_withdraw, {from: wallet_address});
    console.log("Bridge Approved");

    //whitelist
    console.log("Whitelisting Asset...");
    try{
        await erc20_bridge_instance.whitelist_asset_admin(erc20_token_contract.address, 0, "0x11e09c9e87849d7c2d9df126a9057f3b0ebb94e107dfb73f9451854efeeb27dd", {from: wallet_address});
    } catch (e) {
        //may already be whitelisted
    }
    console.log("Whitelist Complete")

    //deposit
    console.log("Depositing VUSD5...")
    await erc20_bridge_instance.deposit_asset(erc20_token_contract.address, 0, amount_to_withdraw, "0xe3b0477cf1e74f5ad1d3de858bd44fe9100ddf7771db434f3cc8a2b6540844c4", {from: wallet_address});
    console.log("VUSD5 Deposited");


    console.log("VUSD5 Balance After Deposit: " + await erc20_token_instance.balanceOf(wallet_address));

    console.log("Setting Validator");
    //remove self as validator (since owner is auto-added
    //TODO fix this bug in the contract, can overflow if you try to remove a signer that isn't already there
    //TODO: ensure that they are there before removing...
    let is_wallet_signer = await multisig_control_instance.is_valid_signer(wallet_address);
    let is_validator_signer = await multisig_control_instance.is_valid_signer(validator_public_address);
    console.log("is_wallet_signer: " + is_wallet_signer);
    console.log("is_validator_signer: " + is_validator_signer);

    if(is_wallet_signer){
        console.log("Removing wallet_address as signer: " + wallet_address);
        await multisig_control_instance.remove_signer_admin(wallet_address, {from:wallet_address});
    }
    if(!is_validator_signer){
        console.log("Adding validator_public_address as signer: " + validator_public_address);
        await multisig_control_instance.add_signer_admin(validator_public_address, {from:wallet_address});
    }

    console.log("Number of valid validators: " + (await multisig_control_instance.get_valid_signer_count()));

    //add validator_public_address as validator
    console.log("Validator Set");

    //({from:eth_wallet})
    console.log("Withdrawing VUSD5...");

    //assemble params
    let withdraw_nonce = new ethUtil.BN(crypto.randomBytes(32));
    let expiry = Math.floor(Date.now()/1000) + 60; // 1 min
    let token_address = erc20_token_instance.address;
    let token_amount = amount_to_withdraw;
    let bot_address = wallet_address;
    let bridge_address = erc20_bridge_instance.address;

    console.log(["address", "uint256", "uint256", "uint256", "address"]);
    console.log([token_address, 0, token_amount, expiry, wallet_address])

    let encoded = get_message_to_sign(
        ["address", "uint256", "uint256", "uint256", "address"],
        [token_address, 0, token_amount, expiry, bot_address],
        withdraw_nonce, "withdraw_asset", bridge_address);

    let msg_hash = ethUtil.keccak256(encoded);
    let all_sigs = [];
    let concat_string =  "0x";
    for(let key_addr in validator_private_keys){
        let key = validator_private_keys[key_addr];
        let sig = ethUtil.ecsign(msg_hash,  key);
        let sig_string = sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
        concat_string = concat_string+ sig_string;
        all_sigs.push("0x" + sig_string);
    }

    let withdrawal_recipt = await erc20_bridge_instance.withdraw_asset(token_address, 0, token_amount, expiry, withdraw_nonce, concat_string, {from:wallet_address});


    //sign with validator_private_key
    //submit withdraw_asset

    console.log("Withdraw Complete");
    console.log("VUSD5 Balance After Withdraw: " + await erc20_token_instance.balanceOf(wallet_address));
}



run_withdrawal();
console.log('Press any key to exit');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));
