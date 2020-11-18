const MultisigControl = artifacts.require("MultisigControl");

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

let pk_array = [
    {public: "0xb89a165ea8b619c14312db316baaa80d2a98b493", private: Buffer.from("adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b",'hex')},
    {public: "0x4ac2efe06b867213698ab317e9569872f8a5e85a", private: Buffer.from("cb5a94687bda25561b2574ce062f0b055f9525c930b3fc9183c019c562b9c404",'hex')},
    {public: "0xbeec72c697e54598271ac242bf82cde87d5632e0", private: Buffer.from("c6a7cd6aa1eafe65c0703162b9128331558fa2f34bcee3a4276953a1acc6ae4e",'hex')},
    {public: "0x4a03ccfbd091354723b9d46043f7cb194d94331b", private: Buffer.from("708392fa9b47f476ab7a03a76139ff472eb1b4acafafcbe8eb17c15933df8a71",'hex')},
    {public: "0x56a16eb54698324304e29a23d65d2ff7f0b7170b", private: Buffer.from("9c23f288f45587c615bbecc0924e5708c7b27ce36f9dc9d242d8f3fd7aab389e",'hex')},
    {public: "0x97166b688c609495c203df28cd2e6d5281f9f71f", private: Buffer.from("de935dc05c5b7cce5e1c27aa4d945b9d820536ee334d4a1c89debd333ae8d866",'hex')},
    {public: "0x9c0b2939538b45b72adb3ec7c52e271f2560c27f", private: Buffer.from("2773543f4def90c5cef0d48d80465e40c8fc22675c7353d114e47fe0847e7683",'hex')},
    {public: "0x13d6d873b31de82ae6724d3e5894b2b40fb968b2", private: Buffer.from("14e47f717c9005c60aa41f1a09b2b6bf8af3870f24de107692ac3aaa87686690",'hex')},
    {public: "0x8447913d48723cbabdcead3377f49e82a3d494a3", private: Buffer.from("5d2b4629b4b06c8d6991d419126270741425c7a784c61179597098521f91afc5",'hex')},
    {public: "0x32321e10a8a0e95f261591520c134d4a6d1743c1", private: Buffer.from("0ff107281c32f8940cb2a0c85bd0627bc427331ad2c9dd2811f1f01d1edb124a",'hex')}
];


//sender for MultisigControl itself is submitting user
//sender for all consuming contracts is the address of that contract
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

function to_signature_string(sig){
    return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
}

function recover_signer_address(sig, msgHash) {
    let publicKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
    let sender = ethUtil.publicToAddress(publicKey);
    return ethUtil.bufferToHex(sender);
}

contract("MultisigControl",  (accounts) => {
    it("should exist", async () => {

        //console.log(accounts);
        let multisigControl_instance = await MultisigControl.deployed();

        let is_account_0_signer = await multisigControl_instance.is_valid_signer(accounts[0]);
        let is_account_1_signer = await multisigControl_instance.is_valid_signer(accounts[1]);

        let threshold = await multisigControl_instance.get_current_threshold();

        console.log("threshold is: " + (threshold/10)+ "%")

        //check if signer
        console.log("account 0 is signer: " + is_account_0_signer)
        console.log("account 1 is signer: " + is_account_1_signer)

        //ADD SIGNER ACCOUNTS[1]
        //sign message
        let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_1 = get_message_to_sign(["address"], [accounts[1]], nonce_1, "add_signer", accounts[0]);
        let message_hash_1 = ethUtil.keccak256(encoded_message_1);
        let signature_1_account_0 = ethUtil.ecsign(message_hash_1, private_keys[accounts[0].toLowerCase()]);
        let signature_1_account_0_string = to_signature_string(signature_1_account_0);
        //verify signature
        let signature_1_recovered_address = recover_signer_address(signature_1_account_0, message_hash_1);
        //console.log(signature_1_recovered_address);
        //run add signer function
        console.log("adding account 1 as signer");
        await multisigControl_instance.add_signer(accounts[1], nonce_1, signature_1_account_0_string, {from: accounts[0]});
        //check if account 1 is new signer
        is_account_1_signer = await multisigControl_instance.is_valid_signer(accounts[1]);
        console.log("account 1 is signer: " + is_account_1_signer)



        //add signer with only one sig
        let is_account_2_signer = await multisigControl_instance.is_valid_signer(accounts[2]);
        console.log("account 2 is signer: " + is_account_2_signer)
        let nonce_2 = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_2 = get_message_to_sign(["address"], [accounts[2]], nonce_2, "add_signer", accounts[0]);
        let message_hash_2 = ethUtil.keccak256(encoded_message_2);
        let signature_2_account_0 = ethUtil.ecsign(message_hash_2, private_keys[accounts[0].toLowerCase()]);
        let signature_2_account_0_string = to_signature_string(signature_2_account_0);

        try{
            console.log("adding account 2 as signer with only account 0");
            await multisigControl_instance.add_signer(accounts[2], nonce_2, signature_2_account_0_string, {from: accounts[0]});
        } catch (e) {
            console.log("adding account 2 as signer with only account 0 failed");
        }

        is_account_2_signer = await multisigControl_instance.is_valid_signer(accounts[2]);
        console.log("account 2 is signer: " + is_account_2_signer)

        let signature_2_account_1 = ethUtil.ecsign(message_hash_2, private_keys[accounts[1].toLowerCase()]);
        let signature_2_account_1_string = to_signature_string(signature_2_account_1);

        let concatinated_sigs = signature_2_account_0_string + signature_2_account_1_string.substring(2);

        //console.log("concat:")
        //console.log(concatinated_sigs)
        //add signer with both signers
        console.log("adding account 2 as signer with account 0 and account 1 signatures");
        await multisigControl_instance.add_signer(accounts[2], nonce_2, concatinated_sigs, {from: accounts[0]});

        is_account_2_signer = await multisigControl_instance.is_valid_signer(accounts[2]);
        console.log("account 2 is signer: " + is_account_2_signer)

    });
})