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

//sender for MultisigControl itself is submitting user
//sender for all consuming contracts is the address of that contract
function get_message_to_sign(param_types, params, nonce, function_name, sender){
    params.push(nonce);
    param_types.push("uint256");
    params.push(function_name);
    param_types.push("string");
    //var encoded_a = abi.rawEncode([ "address","uint256", "string"], [ wallet2, nonce, "add_signer" ]);
    let encoded_a = abi.rawEncode(param_types, params);
    //let encoded = abi.rawEncode(["bytes", "address"], [encoded_a, wallet1]);
    return abi.rawEncode(["bytes", "address"], [encoded_a, sender]);

}


function to_signature_string(sig){
    return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
}

function recover_signer_address(sig, msgHash) {
    let publicKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
    let sender = ethUtil.publicToAddress(publicKey);
    return ethUtil.bufferToHex(sender);
}

//function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
contract("MultisigControl -- Function: verify_signatures",  (accounts) => {
    console.log();
    console.log("verify_signatures(bytes memory signatures, bytes memory message, uint nonce)")
    it("verify_signatures - happy path 1 signer", async () => {
        let multisigControl_instance = await MultisigControl.deployed();

        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0]);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1]);
        assert.equal(
            is_signer_0,
            true,
            "account 0 is not a signer but should be"
        );
        assert.equal(
            is_signer_1,
            false,
            "account 1 is a signer and should not be"
        );

        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));

        //generate message
        let encoded_message_1 =  crypto.randomBytes(32);

        let encoded_hash_1 = ethUtil.keccak256(abi.rawEncode(["bytes", "address"],[encoded_message_1, accounts[0]]));

        let signature = ethUtil.ecsign(encoded_hash_1, private_keys[accounts[0].toLowerCase()]);
        let sig_string = to_signature_string(signature);

        //sign message with private_keys[0]
        //run: function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_string, encoded_message_1, nonce_1, {from: accounts[0]});

        assert.equal(
            verify_receipt,
            true,
            "signatures are bad, try again: "
        );

    });
    it("fail to verify_signatures - bad signatures", async () => {
        let multisigControl_instance = await MultisigControl.deployed();

        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0]);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1]);
        assert.equal(
            is_signer_0,
            true,
            "account 0 is not a signer but should be"
        );
        assert.equal(
            is_signer_1,
            false,
            "account 1 is a signer and should not be"
        );

        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));

        //generate message
        let encoded_message_1 =  crypto.randomBytes(32);

        let encoded_hash_1 = ethUtil.keccak256(abi.rawEncode(["bytes", "address"],[encoded_message_1, accounts[0]]));

        let signature = ethUtil.ecsign(encoded_hash_1, private_keys[accounts[1].toLowerCase()]);
        let sig_string = to_signature_string(signature);

        //sign message with private_keys[0]
        //run: function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_string, encoded_message_1, nonce_1, {from: accounts[0]});

        assert.equal(
            verify_receipt,
            false,
            "signatures are bad, but didn't fail: "
        );

    });

    it("fail to verify_signatures - reused nonce", async () => {
        //NOTE: nonce tracking is a feature of verify_signatures and thus rejecting a reused nonce can be assumed working for any function that properly
        let multisigControl_instance = await MultisigControl.deployed();

        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0]);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1]);
        assert.equal(
            is_signer_0,
            true,
            "account 0 is not a signer but should be"
        );
        assert.equal(
            is_signer_1,
            false,
            "account 1 is a signer and should not be"
        );

        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));

        //generate message
        let encoded_message_1 =  crypto.randomBytes(32);

        let encoded_hash_1 = ethUtil.keccak256(abi.rawEncode(["bytes", "address"],[encoded_message_1, accounts[0]]));

        let signature = ethUtil.ecsign(encoded_hash_1, private_keys[accounts[0].toLowerCase()]);
        let sig_string = to_signature_string(signature);

        //sign message with private_keys[0]
        //run: function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_string, encoded_message_1, nonce_1, {from: accounts[0]});

        assert.equal(
            verify_receipt,
            true,
            "signatures are bad: "
        );
        //actually sending the transaction:
        await multisigControl_instance.verify_signatures(sig_string, encoded_message_1, nonce_1, {from: accounts[0]});

        try{
            await multisigControl_instance.verify_signatures.call(sig_string, encoded_message_1, nonce_1, {from: accounts[0]})
            assert.equal(true, false, "nonce reuse worked, which shouldn't")
        } catch (e) {}
    });

    it("verify_signatures - happy path 2 signers", async () => {

        let multisigControl_instance = await MultisigControl.deployed();

        //admin set accounts[1] as signer
        await multisigControl_instance.add_signer_admin(accounts[1]);
        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0]);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1]);
        assert.equal(
            is_signer_0,
            true,
            "account 0 is not a signer but should be"
        );
        assert.equal(
            is_signer_1,
            true,
            "account 1 is not a signer and should be"
        );

        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count
        );

        let nonce = new ethUtil.BN(crypto.randomBytes(32));

        //generate message
        let encoded_message =  crypto.randomBytes(32);

        let encoded_hash = ethUtil.keccak256(abi.rawEncode(["bytes", "address"],[encoded_message, accounts[0]]));

        let signature_0 = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0 = to_signature_string(signature_0);

        let signature_1 = ethUtil.ecsign(encoded_hash, private_keys[accounts[1].toLowerCase()]);
        let sig_string_1 = to_signature_string(signature_1);

        let sig_bundle = sig_string_0 + sig_string_1.substr(2);

        //sign message with private_keys[0]
        //run: function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_bundle, encoded_message, nonce, {from: accounts[0]});

        assert.equal(
            verify_receipt,
            true,
            "signatures are bad, try again: "
        );

    });

    it("fail to verify_signatures - too few signatures", async () => {
        let multisigControl_instance = await MultisigControl.deployed();

        //admin set accounts[1] as signer
        try{
            await multisigControl_instance.add_signer_admin(accounts[1]);
        } catch (e) {
            // the signer should have been added in a prior step, but just in case
        }
        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0]);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1]);
        assert.equal(
            is_signer_0,
            true,
            "account 0 is not a signer but should be"
        );
        assert.equal(
            is_signer_1,
            true,
            "account 1 is not a signer and should be"
        );

        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count
        );

        let nonce = new ethUtil.BN(crypto.randomBytes(32));
        //generate message
        let encoded_message =  crypto.randomBytes(32);
        let encoded_hash = ethUtil.keccak256(abi.rawEncode(["bytes", "address"],[encoded_message, accounts[0]]));
        let signature_0 = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0 = to_signature_string(signature_0);

        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_string_0, encoded_message, nonce, {from: accounts[0]});
        assert.equal(
            verify_receipt,
            false,
            "too few sigs, but still worked, this is bad"
        );
    });
});

//function set_threshold(uint16 new_threshold, uint nonce, bytes memory signatures) public{
contract("MultisigControl -- Function: set_threshold",  (accounts) => {
    console.log();
    console.log("set_threshold(uint16 new_threshold, uint nonce, bytes memory signatures)")
    it("set_threshold", async () => {
        // set 2 signers
        let multisigControl_instance = await MultisigControl.deployed();
        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        await multisigControl_instance.add_signer_admin(accounts[1]);
        signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count
        );

        // get threshold, should be 500 (50%)
        let threshold = await multisigControl_instance.get_current_threshold();
        assert.equal(
            threshold,
            500,
            "threshold should be 500, is: " + threshold
        );

        // sign with 1, should fail
        let nonce_300 = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_300 = get_message_to_sign(
            ["uint16"],
            [300],
            nonce_300,
            "set_threshold",
            accounts[0]);
        let encoded_hash_300 = ethUtil.keccak256(encoded_message_300);

        let signature_0_300 = ethUtil.ecsign(encoded_hash_300, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_300 = to_signature_string(signature_0_300);

        let signature_1_300 = ethUtil.ecsign(encoded_hash_300, private_keys[accounts[1].toLowerCase()]);
        let sig_string_1_300 = to_signature_string(signature_1_300);

        let sig_bundle_300 = sig_string_0_300 + sig_string_1_300.substr(2);

        //fail to sign with 1 sig
        try {
            await multisigControl_instance.set_threshold(300, nonce_300, sig_string_0_300);
            assert.equal(true, false, "set threshold worked, shouldn't have")
        }catch (e) {}

        // set threshold to 300 (30%) with 2 signers
        await multisigControl_instance.set_threshold(300, nonce_300, sig_bundle_300);

        threshold = await multisigControl_instance.get_current_threshold();
        assert.equal(
            threshold,
            300,
            "threshold should be 300, is: " + threshold
        );

        // set threshold to 500 (50%) with 1 signer
        let nonce_500 = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_500 = get_message_to_sign(
            ["uint16"],
            [500],
            nonce_500,
            "set_threshold",
            accounts[0]);
        let encoded_hash_500 = ethUtil.keccak256(encoded_message_500);

        let signature_0_500 = ethUtil.ecsign(encoded_hash_500, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_500 = to_signature_string(signature_0_500);

        await multisigControl_instance.set_threshold(500, nonce_500, sig_string_0_500);

        threshold = await multisigControl_instance.get_current_threshold();
        assert.equal(
            threshold,
            500,
            "threshold should be 500, is: " + threshold
        );
    });
});

//function add_signer(address new_signer, uint nonce, bytes memory signatures) public {
contract("MultisigControl -- Function: add_signer",  (accounts) => {
    console.log();
    console.log("add_signer(address new_signer, uint nonce, bytes memory signatures)");
    it("add_signer", async () => {
        let multisigControl_instance = await MultisigControl.deployed();
        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        assert.equal(
            await multisigControl_instance.is_valid_signer(accounts[1]),
            false,
            "accounts[1] is signer, shouldn't be"
        );

        let nonce_1_signer = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_1_signer = get_message_to_sign(
            ["address"],
            [accounts[1]],
            nonce_1_signer,
            "add_signer",
            accounts[0]);
        let encoded_hash_1_signer = ethUtil.keccak256(encoded_message_1_signer);

        let signature_0_1_signer = ethUtil.ecsign(encoded_hash_1_signer, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_1_signer = to_signature_string(signature_0_1_signer);

        await multisigControl_instance.add_signer(accounts[1], nonce_1_signer, sig_string_0_1_signer);

        signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count
        );

        assert.equal(
            await multisigControl_instance.is_valid_signer(accounts[1]),
            true,
            "accounts[1] should be signer, isn't"
        );


        let threshold = await multisigControl_instance.get_current_threshold();
        assert.equal(
            threshold,
            500,
            "threshold should be 500, is: " + threshold
        );

        //new signer can sign
        let nonce_2_signers = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_2_signers = get_message_to_sign(
            ["address"],
            [accounts[2]],
            nonce_2_signers,
            "add_signer",
            accounts[0]);
        let encoded_hash_2_signers = ethUtil.keccak256(encoded_message_2_signers);

        let signature_0_2_signers = ethUtil.ecsign(encoded_hash_2_signers, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_2_signers = to_signature_string(signature_0_2_signers);

        let signature_1_2_signers = ethUtil.ecsign(encoded_hash_2_signers, private_keys[accounts[1].toLowerCase()]);
        let sig_string_1_2_signers = to_signature_string(signature_1_2_signers);

        let sig_bundle = sig_string_0_2_signers + sig_string_1_2_signers.substr(2);

        assert.equal(
            await multisigControl_instance.is_valid_signer(accounts[2]),
            false,
            "accounts[2] is signer, shouldn't be"
        );

        await multisigControl_instance.add_signer(accounts[2], nonce_2_signers, sig_bundle);

        assert.equal(
            await multisigControl_instance.is_valid_signer(accounts[2]),
            true,
            "accounts[2] isn't signer, should be"
        );

    });
});

// function remove_signer(address old_signer, uint nonce, bytes memory signatures) public {
contract("MultisigControl -- Function: remove_signer",  (accounts) => {
    console.log();
    console.log("remove_signer(address old_signer, uint nonce, bytes memory signatures)");
    it("remove signer", async () => {
        let multisigControl_instance = await MultisigControl.deployed();
        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        assert.equal(
            await multisigControl_instance.is_valid_signer(accounts[0]),
            true,
            "accounts[1] isn't signer, should be"
        );

        let nonce_valid = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_valid = get_message_to_sign(
            ["address"],
            [accounts[0]],
            nonce_valid,
            "remove_signer",
            accounts[0]);
        let encoded_hash_valid = ethUtil.keccak256(encoded_message_valid);

        let signature_0_valid = ethUtil.ecsign(encoded_hash_valid, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_valid = to_signature_string(signature_0_valid);

        await multisigControl_instance.remove_signer(accounts[0], nonce_valid, sig_string_0_valid);

        signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            0,
            "signer count should be 0, is: " + signer_count
        );

        assert.equal(
            await multisigControl_instance.is_valid_signer(accounts[0]),
            false,
            "accounts[0] is signer, shouldn't be"
        );


        let nonce_invalid = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_invalid = get_message_to_sign(
            ["address"],
            [accounts[0]],
            nonce_invalid,
            "add_signer",
            accounts[0]);
        let encoded_hash_invalid = ethUtil.keccak256(encoded_message_invalid);

        let signature_0_invalid = ethUtil.ecsign(encoded_hash_invalid, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_invalid = to_signature_string(signature_0_invalid);

        try {
            await multisigControl_instance.add_signer(accounts[0], nonce_invalid, sig_string_0_invalid);
            assert(true, false, "account zero added a signer, shouldn't have been able too")
        } catch (e) { }



    });

});

//function is_nonce_used(uint nonce) public view returns(bool){
contract("MultisigControl -- Function: is_nonce_used",  async (accounts) => {

    let multisigControl_instance = await MultisigControl.deployed();
    console.log();
    console.log("get_current_threshold(uint nonce)");
    it("unused nonce returns false", async () => {

        let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));
        assert.equal(
            await multisigControl_instance.is_nonce_used(nonce_1),
            true,
            "nonce marked as used, shouldn't be"
        );

    });


    it("used nonce returns true", async()=>{
        let multisigControl_instance = await MultisigControl.deployed();

        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0]);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1]);
        assert.equal(
            is_signer_0,
            true,
            "account 0 is not a signer but should be"
        );
        assert.equal(
            is_signer_1,
            false,
            "account 1 is a signer and should not be"
        );

        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));

        //generate message
        let encoded_message_1 =  crypto.randomBytes(32);

        let encoded_hash_1 = ethUtil.keccak256(abi.rawEncode(["bytes", "address"],[encoded_message_1, accounts[0]]));

        let signature = ethUtil.ecsign(encoded_hash_1, private_keys[accounts[0].toLowerCase()]);
        let sig_string = to_signature_string(signature);

        //sign message with private_keys[0]
        //run: function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        await multisigControl_instance.verify_signatures(sig_string, encoded_message_1, nonce_1, {from: accounts[0]});

        assert.equal(
            await multisigControl_instance.is_nonce_used(nonce_1),
            true,
            "nonce not marked as used."
        );

    })
});


//function get_valid_signer_count() public view returns(uint8){
contract("MultisigControl -- Function: get_valid_signer_count",  async (accounts) => {

    it("signer count is valid after add signer", async () => {
        let multisigControl_instance = await MultisigControl.deployed();
        //console.log();
        //console.log("get_valid_signer_count()");
        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count //contract is initialized with msg.sender as the only signer, so the count should be 1
        );

        let nonce_1_signer = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_1_signer = get_message_to_sign(
            ["address"],
            [accounts[1]],
            nonce_1_signer,
            "add_signer",
            accounts[0]);
        let encoded_hash_1_signer = ethUtil.keccak256(encoded_message_1_signer);

        let signature_0_1_signer = ethUtil.ecsign(encoded_hash_1_signer, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_1_signer = to_signature_string(signature_0_1_signer);

        await multisigControl_instance.add_signer(accounts[1], nonce_1_signer, sig_string_0_1_signer);

        signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count
        );



    });
    it("signer count is valid after remove signer", async () => {
        let multisigControl_instance = await MultisigControl.deployed();
        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count //we saw that count was 2 in last test, so the count should be 2
        );

        let threshold = await multisigControl_instance.get_current_threshold();
        assert.equal(
            threshold,
            500,
            "threshold should be 500, is: " + threshold
        );

        //new signer can sign
        let nonce_2_signers = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_2_signers = get_message_to_sign(
            ["address"],
            [accounts[1]],
            nonce_2_signers,
            "remove_signer",
            accounts[0]);
        let encoded_hash_2_signers = ethUtil.keccak256(encoded_message_2_signers);

        let signature_0_2_signers = ethUtil.ecsign(encoded_hash_2_signers, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_2_signers = to_signature_string(signature_0_2_signers);

        let signature_1_2_signers = ethUtil.ecsign(encoded_hash_2_signers, private_keys[accounts[1].toLowerCase()]);
        let sig_string_1_2_signers = to_signature_string(signature_1_2_signers);

        let sig_bundle = sig_string_0_2_signers + sig_string_1_2_signers.substr(2);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1]);
        assert.equal(
            is_signer_1,
            true,
            "account 1 is not a signer and should be"
        );

        await multisigControl_instance.remove_signer(accounts[1], nonce_2_signers, sig_bundle);

        is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1]);
        assert.equal(
            is_signer_1,
            false,
            "account 1 is a signer and should not be"
        );

        signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count //we saw that count was 2 in last test, so the count should be 2
        );


    });
});

//function get_current_threshold() public view returns(uint16) {
contract("MultisigControl -- Function: get_current_threshold",  (accounts) => {
    console.log();
    console.log("get_current_threshold()");
    it("get_current_threshold is correct after setting", async () => {
        let multisigControl_instance = await MultisigControl.deployed();

        let threshold = await multisigControl_instance.get_current_threshold();
        assert.equal(
            threshold,
            500,// threshold is initialized to 500
            "threshold should be 300, is: " + threshold
        );

        // set threshold to 300 (30%) with 1 signer
        let nonce_300 = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_300 = get_message_to_sign(
            ["uint16"],
            [300],
            nonce_300,
            "set_threshold",
            accounts[0]);
        let encoded_hash_300 = ethUtil.keccak256(encoded_message_300);

        let signature_0_300 = ethUtil.ecsign(encoded_hash_300, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_300 = to_signature_string(signature_0_300);

        await multisigControl_instance.set_threshold(300, nonce_300, sig_string_0_300);

        threshold = await multisigControl_instance.get_current_threshold();
        assert.equal(
            threshold,
            300,
            "threshold should be 300, is: " + threshold
        );


    });
});

//function is_valid_signer(address signer_address) public view returns(bool){
contract("MultisigControl -- Function: is_valid_signer",  (accounts) => {
    console.log();
    console.log("is_valid_signer(address signer_address)");
    it("previously unknown signer is valid after setting", async () => {
        let multisigControl_instance = await MultisigControl.deployed();
        //console.log();
        //console.log("get_valid_signer_count()");
        let signer_count = await multisigControl_instance.get_valid_signer_count();
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count //contract is initialized with msg.sender as the only signer, so the count should be 1
        );

        let nonce_1_signer = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_1_signer = get_message_to_sign(
            ["address"],
            [accounts[4]],
            nonce_1_signer,
            "add_signer",
            accounts[0]);
        let encoded_hash_1_signer = ethUtil.keccak256(encoded_message_1_signer);

        let signature_0_1_signer = ethUtil.ecsign(encoded_hash_1_signer, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_1_signer = to_signature_string(signature_0_1_signer);


        let is_signer_4 = await multisigControl_instance.is_valid_signer(accounts[4]);
        assert.equal(
            is_signer_4,
            false,
            "account 4 is a signer and should not be"
        );

        await multisigControl_instance.add_signer(accounts[4], nonce_1_signer, sig_string_0_1_signer);

        is_signer_4 = await multisigControl_instance.is_valid_signer(accounts[4]);
        assert.equal(
            is_signer_4,
            true,
            "account 4 is not a signer and should be"
        );

    });
    it("previously valid signer is invalid after setting as invalid", async () => {
        let multisigControl_instance = await MultisigControl.deployed();
        let nonce_2_signers = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message_2_signers = get_message_to_sign(
            ["address"],
            [accounts[4]],
            nonce_2_signers,
            "remove_signer",
            accounts[0]);
        let encoded_hash_2_signers = ethUtil.keccak256(encoded_message_2_signers);

        let signature_0_2_signers = ethUtil.ecsign(encoded_hash_2_signers, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0_2_signers = to_signature_string(signature_0_2_signers);

        let signature_1_2_signers = ethUtil.ecsign(encoded_hash_2_signers, private_keys[accounts[4].toLowerCase()]);
        let sig_string_1_2_signers = to_signature_string(signature_1_2_signers);

        let sig_bundle = sig_string_0_2_signers + sig_string_1_2_signers.substr(2);
        let is_signer_4 = await multisigControl_instance.is_valid_signer(accounts[4]);
        assert.equal(
            is_signer_4,
            true,
            "account 4 is not a signer and should be"
        );

        await multisigControl_instance.remove_signer(accounts[4], nonce_2_signers, sig_bundle);
        is_signer_4 = await multisigControl_instance.is_valid_signer(accounts[4]);
        assert.equal(
            is_signer_4,
            false,
            "account 4 is a signer and should not be"
        );
    });
    it("unknown signers are invalid", async () => {
        let multisigControl_instance = await MultisigControl.deployed();
        let is_signer_5 = await multisigControl_instance.is_valid_signer(accounts[5]);
        assert.equal(
            is_signer_5,
            false,
            "account 5 is a signer and should not be"
        );
    });

});
