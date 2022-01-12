const MultisigControl = artifacts.require("MultisigControl");


var abi = require('ethereumjs-abi');
var crypto = require("crypto");
var ethUtil = require('ethereumjs-util');


/*The following will generate 10 addresses from the mnemonic located in the .secret file*/
const fs = require("fs");
//TODO: ganache-cli -m "contents of .secret"
const mnemonic = fs.readFileSync(".secret").toString().trim();

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const wallet = require('ethereumjs-wallet');

let private_keys ={};
async function init_private_keys(){
  private_keys = {};
  for(let key_idx = 0; key_idx < 10; key_idx++){
    const seed = await bip39.mnemonicToSeed(mnemonic); // mnemonic is the string containing the words

    const hdk = hdkey.fromMasterSeed(seed);
    const addr_node = hdk.derivePath("m/44'/60'/0'/0/" + key_idx); //m/44'/60'/0'/0/0 is derivation path for the first account. m/44'/60'/0'/0/1 is the derivation path for the second account and so on
    const addr = addr_node.getWallet().getAddressString(); //check that this is the same with the address that ganache list for the first account to make sure the derivation is correct
    const private_key = addr_node.getWallet().getPrivateKey();
    //console.log(private_key)
    //console.log(addr.toString("hex"))
    //console.log(private_key.toString("hex"))
    private_keys[addr.toString("hex")] = private_key;
  }
}

/****** note, add:
beforeEach(async()=>{
  await init_private_keys()

});
*** to each "contract" section before tests */

/*end of address generation*/


//sender for MultisigControl itself is submitting user
//sender for all consuming contracts is the address of that contract
function get_message_to_sign(param_types, params, nonce, function_name, sender, signer_sequence_number){
    params.push(nonce);
    param_types.push("uint256");
    params.push(function_name);
    param_types.push("string");
    //var encoded_a = abi.rawEncode([ "address","uint256", "string"], [ wallet2, nonce, "add_signer" ]);
    let encoded_a = abi.rawEncode(param_types, params);
    //let encoded = abi.rawEncode(["bytes", "address"], [encoded_a, wallet1]);
    return abi.rawEncode(["bytes", "address", "uint256"], [encoded_a, sender, signer_sequence_number]);
}


function to_signature_string(sig){
    return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
}

function recover_signer_address(sig, msgHash) {
    let publicKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
    let sender = ethUtil.publicToAddress(publicKey);
    return ethUtil.bufferToHex(sender);
}

async function update_signer_set(multisigControl_instance, new_signers, new_threshold, sender, signers){
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let latest_sequence = (await multisigControl_instance.signer_sequence_number()) -1;

  let encoded_message = get_message_to_sign(
      ["address[]", "uint16"],
      [new_signers, new_threshold],
      nonce.toString(),
      "update_signer_set",
      sender,
      latest_sequence);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let sig_string = "0x";
  for(let signers_idx =0; signers_idx< signers.length; signers_idx++){
    let signature = ethUtil.ecsign(encoded_hash, private_keys[signers[signers_idx].toLowerCase()]);
    sig_string += to_signature_string(signature).substr(2);
  }

  await multisigControl_instance.update_signer_set(new_signers, new_threshold, nonce, latest_sequence, sig_string);
}

async function disable_sequence_number(multisigControl_instance, sequence_to_disable, sender, signers, sequence_number){
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  let encoded_message = get_message_to_sign(
      ["uint256"],
      [sequence_to_disable],
      nonce.toString(),
      "disable_sequence_number",
      sender,
      sequence_number);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let sig_string = "0x";
  for(let signers_idx =0; signers_idx< signers.length; signers_idx++){
    let signature = ethUtil.ecsign(encoded_hash, private_keys[signers[signers_idx].toLowerCase()]);
    sig_string += to_signature_string(signature).substr(2);
  }
  await multisigControl_instance.disable_sequence_number(sequence_to_disable, nonce, sequence_number, sig_string);
}

//function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
contract("MultisigControl -- Function: verify_signatures",  (accounts) => {
  beforeEach(async()=>{
    await init_private_keys()

  });
    it("verify_signatures - happy path 1 signer", async () => {
        let multisigControl_instance = await MultisigControl.deployed();

        let target_sequence = 0;

        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0], target_sequence);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1], target_sequence);
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

        let signer_count = await multisigControl_instance.get_signer_count(target_sequence);
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));

        //generate message
        let encoded_message_1 =  crypto.randomBytes(32);

        let encoded_hash_1 = ethUtil.keccak256(abi.rawEncode(["bytes", "address", "uint256"],[encoded_message_1, accounts[0], target_sequence]));

        let signature = ethUtil.ecsign(encoded_hash_1, private_keys[accounts[0].toLowerCase()]);
        let sig_string = to_signature_string(signature);

        //sign message with private_keys[0]
        //run: function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_string, encoded_message_1, nonce_1, target_sequence, {from: accounts[0]});

        assert.equal(
            verify_receipt,
            true,
            "signatures are bad, try again: "
        );

    });


    it("fail to verify_signatures - bad signatures", async () => {
        let multisigControl_instance = await MultisigControl.deployed();
        let target_sequence = 0;
        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0], target_sequence);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1], target_sequence);
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

        let signer_count = await multisigControl_instance.get_signer_count(target_sequence);
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));

        //generate message
        let encoded_message_1 =  crypto.randomBytes(32);

        let encoded_hash_1 = ethUtil.keccak256(abi.rawEncode(["bytes", "address", "uint256"],[encoded_message_1, accounts[0], target_sequence]));

        let signature = ethUtil.ecsign(encoded_hash_1, private_keys[accounts[1].toLowerCase()]);
        let sig_string = to_signature_string(signature);

        //sign message with private_keys[0]
        //run: function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_string, encoded_message_1, nonce_1, target_sequence, {from: accounts[0]});

        assert.equal(
            verify_receipt,
            false,
            "signatures are bad, but didn't fail: "
        );

    });

    it("fail to verify_signatures - reused nonce", async () => {
        //NOTE: nonce tracking is a feature of verify_signatures and thus rejecting a reused nonce can be assumed working for any function that properly
        let multisigControl_instance = await MultisigControl.deployed();
        let target_sequence = 0;

        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0], target_sequence);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1], target_sequence);
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

        let signer_count = await multisigControl_instance.get_signer_count(target_sequence);
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));

        //generate message
        let encoded_message_1 =  crypto.randomBytes(32);

        let encoded_hash_1 = ethUtil.keccak256(abi.rawEncode(["bytes", "address", "uint256"],[encoded_message_1, accounts[0], target_sequence]));

        let signature = ethUtil.ecsign(encoded_hash_1, private_keys[accounts[0].toLowerCase()]);
        let sig_string = to_signature_string(signature);

        //sign message with private_keys[0]
        //run: function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_string, encoded_message_1, nonce_1, target_sequence, {from: accounts[0]});

        assert.equal(
            verify_receipt,
            true,
            "signatures are bad: "
        );
        //actually sending the transaction:
        await multisigControl_instance.verify_signatures(sig_string, encoded_message_1, nonce_1, target_sequence, {from: accounts[0]});

        try{
            await multisigControl_instance.verify_signatures.call(sig_string, encoded_message_1, nonce_1, target_sequence, {from: accounts[0]})
            assert.equal(true, false, "nonce reuse worked, which shouldn't")
        } catch (e) {}
    });

    it("verify_signatures - happy path 2 signers", async () => {

        let multisigControl_instance = await MultisigControl.deployed();

        await update_signer_set(multisigControl_instance, [accounts[0],accounts[1]], 500, accounts[0], [accounts[0]]);
        let new_sequence_number = await multisigControl_instance.signer_sequence_number() -1;

        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0], new_sequence_number);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1], new_sequence_number);
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

        let signer_count = await multisigControl_instance.get_signer_count(new_sequence_number);
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count
        );

        let nonce = new ethUtil.BN(crypto.randomBytes(32));

        //generate message
        let encoded_message =  crypto.randomBytes(32);

        let encoded_hash = ethUtil.keccak256(abi.rawEncode(["bytes", "address", "uint256"],[encoded_message, accounts[0], new_sequence_number]));

        let signature_0 = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0 = to_signature_string(signature_0);

        let signature_1 = ethUtil.ecsign(encoded_hash, private_keys[accounts[1].toLowerCase()]);
        let sig_string_1 = to_signature_string(signature_1);

        let sig_bundle = sig_string_0 + sig_string_1.substr(2);

        //sign message with private_keys[0]
        //run: function verify_signatures(bytes memory signatures, bytes memory message, uint nonce) public returns(bool) {
        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_bundle, encoded_message, nonce, new_sequence_number, {from: accounts[0]});

        assert.equal(
            verify_receipt,
            true,
            "signatures are bad, try again: "
        );
    });

    it("fail to verify_signatures - too few signatures", async () => {
        let multisigControl_instance = await MultisigControl.deployed();


        await update_signer_set(multisigControl_instance, [accounts[0],accounts[1]], 500, accounts[0],[accounts[0], accounts[1]]);
        let new_sequence_number = await multisigControl_instance.signer_sequence_number() -1;
        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0],new_sequence_number);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1],new_sequence_number);

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

        let signer_count = await multisigControl_instance.get_signer_count(new_sequence_number);
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count
        );

        let nonce = new ethUtil.BN(crypto.randomBytes(32));
        //generate message
        let encoded_message =  crypto.randomBytes(32);
        let encoded_hash = ethUtil.keccak256(abi.rawEncode(["bytes", "address", "uint256"],[encoded_message, accounts[0], new_sequence_number]));
        let signature_0 = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
        let sig_string_0 = to_signature_string(signature_0);

        let verify_receipt = await multisigControl_instance.verify_signatures.call(sig_string_0, encoded_message, nonce, new_sequence_number, {from: accounts[0]});
        assert.equal(
            verify_receipt,
            false,
            "too few sigs, but still worked, this is bad"
        );
    });
  })
  contract("MultisigControl -- Function: update_signer_set",  (accounts) => {
    beforeEach(async()=>{
      await init_private_keys()

    });
      it("update_signer_set", async () => {
        let multisigControl_instance = await MultisigControl.deployed();


        await update_signer_set(multisigControl_instance, [accounts[0],accounts[1]], 500, accounts[0], [accounts[0], accounts[1]]);
        let new_sequence_number = await multisigControl_instance.signer_sequence_number() -1;
        //check that only private_keys[0] is the signer
        let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0],new_sequence_number);
        let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1],new_sequence_number);

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

        let signer_count = await multisigControl_instance.get_signer_count(new_sequence_number);
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count
        );
      });

    });


    contract("MultisigControl -- Function: is_nonce_used",  async (accounts) => {
      beforeEach(async()=>{
        await init_private_keys()

      });

        it("unused nonce returns false", async () => {
          let multisigControl_instance = await MultisigControl.deployed();
            let nonce_1 = new ethUtil.BN(crypto.randomBytes(32));
            assert.equal(
                await multisigControl_instance.is_nonce_used(nonce_1),
                false,
                "nonce marked as used, shouldn't be"
            );

        });


        it("used nonce returns true", async()=>{
            let multisigControl_instance = await MultisigControl.deployed();
            let target_sequence = 0;
            //check that only private_keys[0] is the signer
            let is_signer_0 = await multisigControl_instance.is_valid_signer(accounts[0], target_sequence);
            let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1], target_sequence);
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

            let signer_count = await multisigControl_instance.get_signer_count(target_sequence);
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
            await multisigControl_instance.verify_signatures(sig_string, encoded_message_1, nonce_1,target_sequence, {from: accounts[0]});

            assert.equal(
                await multisigControl_instance.is_nonce_used(nonce_1),
                true,
                "nonce not marked as used."
            );

        })
    });


    contract("MultisigControl -- Function: get_signer_count",  async (accounts) => {
      beforeEach(async()=>{
        await init_private_keys()

      });
        it("signer count is valid after add signer", async () => {
            let multisigControl_instance = await MultisigControl.deployed();
            let target_sequence = 0;
            let signer_count = await multisigControl_instance.get_signer_count(target_sequence);
            assert.equal(
                signer_count,
                1,
                "signer count should be 1, is: " + signer_count //contract is initialized with msg.sender as the only signer, so the count should be 1
            );

            await update_signer_set(multisigControl_instance, [accounts[0],accounts[1]], 500, accounts[0], [accounts[0]]);
            let new_sequence_number = await multisigControl_instance.signer_sequence_number() -1;

            signer_count = await multisigControl_instance.get_signer_count(new_sequence_number);
            assert.equal(
                signer_count,
                2,
                "signer count should be 2, is: " + signer_count
            );

        });
        it("signer count is valid after remove signer", async () => {
            let multisigControl_instance = await MultisigControl.deployed();
            let target_sequence = await multisigControl_instance.signer_sequence_number() -1;
            let signer_count = await multisigControl_instance.get_signer_count(target_sequence);
            assert.equal(
                signer_count,
                2,
                "signer count should be 2, is: " + signer_count //we saw that count was 2 in last test, so the count should be 2
            );

            let threshold = await multisigControl_instance.get_threshold(target_sequence);
            assert.equal(
                threshold,
                500,
                "threshold should be 500, is: " + threshold
            );

            let is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1], target_sequence);
            assert.equal(
                is_signer_1,
                true,
                "account 1 is not a signer and should be"
            );


            await update_signer_set(multisigControl_instance, [accounts[0]], 500, accounts[0], [accounts[0], accounts[1]]);
            let new_sequence_number = await multisigControl_instance.signer_sequence_number() -1;

            is_signer_1 = await multisigControl_instance.is_valid_signer(accounts[1], new_sequence_number);
            assert.equal(
                is_signer_1,
                false,
                "account 1 is a signer and should not be"
            );

            signer_count = await multisigControl_instance.get_signer_count(new_sequence_number);
            assert.equal(
                signer_count,
                1,
                "signer count should be 1, is: " + signer_count //we saw that count was 2 in last test, so the count should be 2
            );


        });
    });


    contract("MultisigControl -- Function: is_valid_signer",  (accounts) => {
        it("previously unknown signer is valid after setting", async () => {
            let multisigControl_instance = await MultisigControl.deployed();
            let target_sequence = 0;
            let signer_count = await multisigControl_instance.get_signer_count(target_sequence);

            assert.equal(
                signer_count,
                1,
                "signer count should be 1, is: " + signer_count //contract is initialized with msg.sender as the only signer, so the count should be 1
            );

            let is_signer_4 = await multisigControl_instance.is_valid_signer(accounts[4], target_sequence);
            assert.equal(
                is_signer_4,
                false,
                "account 4 is a signer and should not be"
            );

            await update_signer_set(multisigControl_instance, [accounts[0], accounts[4]], 500, accounts[0], [accounts[0]]);
            let new_sequence_number = await multisigControl_instance.signer_sequence_number() -1;

            is_signer_4 = await multisigControl_instance.is_valid_signer(accounts[4], new_sequence_number);
            assert.equal(
                is_signer_4,
                true,
                "account 4 is not a signer and should be"
            );

        });
        it("previously valid signer is invalid after setting as invalid", async () => {
            let multisigControl_instance = await MultisigControl.deployed();
            let nonce_2_signers = new ethUtil.BN(crypto.randomBytes(32));
            let target_sequence = await multisigControl_instance.signer_sequence_number() -1;

            let is_signer_4 = await multisigControl_instance.is_valid_signer(accounts[4], target_sequence);
            assert.equal(
                is_signer_4,
                true,
                "account 4 is not a signer and should be"
            );

            await update_signer_set(multisigControl_instance, [accounts[0]], 500, accounts[0], [accounts[0], accounts[4]]);
            let new_sequence_number = await multisigControl_instance.signer_sequence_number() -1;

            is_signer_4 = await multisigControl_instance.is_valid_signer(accounts[4],new_sequence_number);
            assert.equal(
                is_signer_4,
                false,
                "account 4 is a signer and should not be"
            );
        });
        it("unknown signers are invalid", async () => {
            let multisigControl_instance = await MultisigControl.deployed();
            let is_signer_5 = await multisigControl_instance.is_valid_signer(accounts[5], 0);
            assert.equal(
                is_signer_5,
                false,
                "account 5 is a signer and should not be"
            );
        });

    });

  contract("MultisigControl -- set threshold",  (accounts) => {
    beforeEach(async()=>{
      await init_private_keys()

    });
    it("set threshold", async () => {
        // set 2 signers
        let multisigControl_instance = await MultisigControl.deployed();

        let target_sequence = await multisigControl_instance.signer_sequence_number() -1;
        let signer_count = await multisigControl_instance.get_signer_count(target_sequence);
        assert.equal(
            signer_count,
            1,
            "signer count should be 1, is: " + signer_count
        );

        await update_signer_set(multisigControl_instance, [accounts[0], accounts[1]], 500, accounts[0], [accounts[0]]);
        let new_sequence_number = await multisigControl_instance.signer_sequence_number() -1;

        // get threshold, should be 500 (50%)
        let threshold = await multisigControl_instance.get_threshold(new_sequence_number);
        assert.equal(
            threshold,
            500,
            "threshold should be 500, is: " + threshold
        );

        signer_count = await multisigControl_instance.get_signer_count(new_sequence_number);
        assert.equal(
            signer_count,
            2,
            "signer count should be 2, is: " + signer_count
        );


        try{
          // sign with 1, should fail
          await update_signer_set(multisigControl_instance, [accounts[0], accounts[1]], 300, accounts[0], [accounts[0]]);
          assert.equal(true, false, "too few signers worked, shouldn't have");
        }catch(ex){}
        try{
          //wrong signers, should fail
          await update_signer_set(multisigControl_instance, [accounts[0], accounts[1]], 300, accounts[0], [accounts[0], accounts[2]]);
          assert.equal(true, false, "wrong signers worked, shouldn't have")
        }catch(ex){}

        await update_signer_set(multisigControl_instance, [accounts[0], accounts[1]], 300, accounts[0], [accounts[0], accounts[1]]);
        let sequence_300 = await multisigControl_instance.signer_sequence_number() -1;

        threshold = await multisigControl_instance.get_threshold(sequence_300);
        assert.equal(
            threshold,
            300,
            "threshold should be 300, is: " + threshold
        );

        await update_signer_set(multisigControl_instance, [accounts[0], accounts[1]], 500, accounts[0], [accounts[0]]);
        let sequence_500 = await multisigControl_instance.signer_sequence_number() -1;

        threshold = await multisigControl_instance.get_threshold(sequence_500);
        assert.equal(
            threshold,
            500,
            "threshold should be 500, is: " + threshold
        );
    });
});

contract("MultisigControl -- disable_sequence_number", (accounts) => {
  beforeEach(async()=>{
    await init_private_keys()

  });

  it("disable_sequence_number", async () => {

    let multisigControl_instance = await MultisigControl.deployed();
    await update_signer_set(multisigControl_instance, [accounts[0],accounts[1]], 500, accounts[0], [accounts[0], accounts[1]]);
    let sequence_to_disable = (await multisigControl_instance.signer_sequence_number()) -1;

    //get signer count for sequence 0
    let signer_count = await multisigControl_instance.get_signer_count(0);
    assert.equal(
        signer_count,
        1,
        "signer count should be 1, is: " + signer_count
    );

    await disable_sequence_number(multisigControl_instance, 0,accounts[0], [accounts[0], accounts[1]], sequence_to_disable);
    signer_count = await multisigControl_instance.get_signer_count(0);
    assert.equal(
        signer_count,
        0,
        "signer count should be 0, is: " + signer_count
    );

    await disable_sequence_number(multisigControl_instance, 0,accounts[0], [accounts[0], accounts[1]], sequence_to_disable);
    signer_count = await multisigControl_instance.get_signer_count(0);
    assert.equal(
        signer_count,
        0,
        "signer count should be 0, is: " + signer_count
    );

    signer_count = await multisigControl_instance.get_signer_count(sequence_to_disable);
    assert.equal(
        signer_count,
        2,
        "signer count should be 2, is: " + signer_count
    );

    await disable_sequence_number(multisigControl_instance, sequence_to_disable,accounts[0], [accounts[0], accounts[1]], sequence_to_disable);
    signer_count = await multisigControl_instance.get_signer_count(sequence_to_disable);
    assert.equal(
        signer_count,
        0,
        "signer count should be 0, is: " + signer_count
    );



    try {
      //should fail since latest set is disabled
      await update_signer_set(multisigControl_instance, [accounts[0],accounts[1]], 500, accounts[0], [accounts[0], accounts[1]]);
      assert.equal(true,false, "disabled signer sequence still worked, this is wrong");
    } catch(e){}
    try {
      //should fail
      await disable_sequence_number(multisigControl_instance, sequence_to_disable,accounts[0], [accounts[0], accounts[1]], sequence_to_disable);
      assert.equal(true,false, "disabled signer can still disable, this is wrong");
    } catch(e){}

  });
})
