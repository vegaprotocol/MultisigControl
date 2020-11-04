const MultisigControl = artifacts.require("MultisigControl");
const Vega_Bridge_ERC20 = artifacts.require("Vega_Bridge_ERC20");
const VUSD_TEST = artifacts.require("VUSD_TEST");

var abi = require('ethereumjs-abi');
var crypto = require("crypto");
var ethUtil = require('ethereumjs-util');

//TODO: ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"
let private_keys =
    {
        "0xb89a165ea8b619c14312db316baaa80d2a98b493":Buffer.from("adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b",'hex'),
        "0x4ac2efe06b867213698ab317e9569872f8a5e85a":Buffer.from("cb5a94687bda25561b2574ce062f0b055f9525c930b3fc9183c019c562b9c404",'hex'),
        "0xbeec72c697e54598271ac242bf82cde87d5632e0":Buffer.from("c6a7cd6aa1eafe65c0703162b9128331558fa2f34bcee3a4276953a1acc6ae4e",'hex'),
        "0x4a03ccfbd091354723b9d46043f7cb194d94331b":Buffer.from("708392fa9b47f476ab7a03a76139ff472eb1b4acafafcbe8eb17c15933df8a71",'hex'),
        "0x56a16eb54698324304e29a23d65d2ff7f0b7170b":Buffer.from("9c23f288f45587c615bbecc0924e5708c7b27ce36f9dc9d242d8f3fd7aab389e",'hex'),
        "0x97166b688c609495c203df28cd2e6d5281f9f71f":Buffer.from("de935dc05c5b7cce5e1c27aa4d945b9d820536ee334d4a1c89debd333ae8d866",'hex'),
        "0x9c0b2939538b45b72adb3ec7c52e271f2560c27f":Buffer.from("2773543f4def90c5cef0d48d80465e40c8fc22675c7353d114e47fe0847e7683",'hex'),
        "0x13d6d873b31de82ae6724d3e5894b2b40fb968b2":Buffer.from("14e47f717c9005c60aa41f1a09b2b6bf8af3870f24de107692ac3aaa87686690",'hex'),
        "0x8447913d48723cbabdcead3377f49e82a3d494a3":Buffer.from("5d2b4629b4b06c8d6991d419126270741425c7a784c61179597098521f91afc5",'hex'),
        "0x32321e10a8a0e95f261591520c134d4a6d1743c1":Buffer.from("0ff107281c32f8940cb2a0c85bd0627bc427331ad2c9dd2811f1f01d1edb124a",'hex')
    };

// VEGA PUBLIC KEY TEST:
//c89c6161e8fc1708303da1c0721704e79260561a385e775de178295029a189c6

//sender for MultisigControl itself is submitting user
//sender for all consuming contracts is the address of that contract
function get_message_to_sign(param_types, params, nonce, function_name, sender){

    //get_message_to_sign(["address"], [VUSD_TEST.address], nonce, "whitelist_asset", Vega_Bridge_ERC20.address);
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

function to_signature_string(sig){
    return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
}

function recover_signer_address(sig, msgHash) {
    let publicKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
    let sender = ethUtil.publicToAddress(publicKey);
    return ethUtil.bufferToHex(sender);
}


contract("Vega_Bridge_ERC20",  (accounts) => {
    it("should deposit vusd", async () => {
	
        let signer_key = private_keys["0xb89a165ea8b619c14312db316baaa80d2a98b493"];


        let multisigControl_instance = await MultisigControl.deployed();
        let vega_bridge_erc20_instance = await Vega_Bridge_ERC20.deployed();
        let vusd_test_instance = await  VUSD_TEST.deployed();

        let multisig_control_address = await vega_bridge_erc20_instance.get_multisig_control_address();
        console.log("multisig_control_address before setting: " + multisig_control_address);
        //add multisig contract
        await vega_bridge_erc20_instance.set_multisig_control(MultisigControl.address);
        multisig_control_address = await vega_bridge_erc20_instance.get_multisig_control_address();
        console.log("multisig_control_address after setting: " + multisig_control_address);

        //check if token whitelisted
        let is_token_whitelisted = await vega_bridge_erc20_instance.is_asset_whitelisted(VUSD_TEST.address, 0);
        console.log("token whitelisted before setting: " + is_token_whitelisted);

        //get tokens from faucet
        await vusd_test_instance.faucet();
        let token_balance = await vusd_test_instance.balanceOf(accounts[0]);
        console.log("accounts[0] token balance: " + token_balance);

        //approve transfer
        await vusd_test_instance.approve(Vega_Bridge_ERC20.address, token_balance);

       await vega_bridge_erc20_instance.whitelist_asset_admin(VUSD_TEST.address, 0, "0x11e09c9e87849d7c2d9df126a9057f3b0ebb94e107dfb73f9451854efeeb27dd");
	    //try to deposit token

        console.log("attempting to deposit token after whitelist");
        let deposit_receipt = await vega_bridge_erc20_instance.deposit_asset(VUSD_TEST.address, 0, token_balance, "0xe3b0477cf1e74f5ad1d3de858bd44fe9100ddf7771db434f3cc8a2b6540844c4");
        let log = deposit_receipt.logs[0];
        console.log("Deposit successful!")
        console.log()
        console.log("deposit receipt:");
        console.log("Event: " + log.event);
        console.log("user_address: " + log.args.user_address);
        console.log("asset_source: " + log.args.asset_source);
        console.log("amount: " + log.args.amount.toString());
        console.log("vega_public_key: " + log.args.vega_public_key);
        console.log("Bridge address: " + Vega_Bridge_ERC20.address);
	console.log();
        console.log()
	

    });

})

