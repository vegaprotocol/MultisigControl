const ETH_Asset_Pool = artifacts.require("ETH_Asset_Pool");
const MultisigControl = artifacts.require("MultisigControl");
const ETH_Bridge_Logic = artifacts.require("ETH_Bridge_Logic");

const { shouldFailWithMessage, parseEther, duration, latest } = require("../helpers/utils");

const abi = require('ethereumjs-abi');
const crypto = require("crypto");
const ethUtil = require('ethereumjs-util');

let root_path = "../ropsten_deploy_details/local/";

let bridge_addresses = require(root_path + "bridge_addresses.json");
// {"eth_asset_pool":"0xc6a6000d740707edc35f75f42447320B60450c04","eth_bridge_logic":"0xE25F12E386Cd7F84c41B5210504d9743A35Badda"}

/*The following will generate 10 addresses from the mnemonic located in the .secret file*/
const fs = require("fs");
//TODO: ganache-cli -m "contents of .secret"
const mnemonic = fs.readFileSync(".secret").toString().trim();

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const wallet = require('ethereumjs-wallet');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const { findEventInTransaction } = require('../helpers/events');
const { expectBignumberEqual, expect } = require("../helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { formatEther } = require("@ethersproject/units");
const exp = require("constants");

let private_keys = {};
async function init_private_keys() {
    private_keys = {};
    for (let key_idx = 0; key_idx < 10; key_idx++) {
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

//sender for MultisigControl itself is submitting user
//sender for all consuming contracts is the address of that contract
function get_message_to_sign(param_types, params, nonce, function_name, sender) {
    params.push(nonce);
    param_types.push("uint256");
    params.push(function_name);
    param_types.push("string");

    //var encoded_a = abi.rawEncode([ "address","uint256", "string"], [ wallet2, nonce, "add_signer" ]);
    let encoded_a = abi.rawEncode(param_types, params);
    //let encoded = abi.rawEncode(["bytes", "address"], [encoded_a, wallet1]);
    return abi.rawEncode(["bytes", "address"], [encoded_a, sender]);
}


function to_signature_string(sig) {
    return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') + "" + sig.v.toString(16);
}

async function deposit_asset(bridge_logic_instance, account, amount) {
    let wallet_pubkey = crypto.randomBytes(32);
    let receipt = await bridge_logic_instance.deposit_asset(wallet_pubkey, { from: account, value: amount });
    return receipt;
}

async function withdraw_asset(bridge_logic_instance, account, expiry, bad_params, bad_user) {
    let nonce = new ethUtil.BN(crypto.randomBytes(32));
    let to_withdraw = (await web3.eth.getBalance(ETH_Asset_Pool.address)).toString();
    let target = account;

    if (bad_user !== undefined) {
        target = bad_user;
    }

    //create signature
    let encoded_message = get_message_to_sign(
        ["uint256", "uint256", "address"],
        [to_withdraw, expiry, account],
        nonce,
        "withdraw_asset",
        ETH_Bridge_Logic.address);
    let encoded_hash = ethUtil.keccak256(encoded_message);
    let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);

    let sig_string = to_signature_string(signature);

    //NOTE Sig tests are in MultisigControl
    if (bad_params) {
        to_withdraw = "1"
    }

    let receipt = await bridge_logic_instance.withdraw_asset(to_withdraw, expiry, target, nonce, sig_string, { from: account });
    return receipt;
}


async function set_bridge_address(asset_pool_instance, bridge_logic_address, account) {
    let nonce = new ethUtil.BN(crypto.randomBytes(32));
    //create signature
    let encoded_message = get_message_to_sign(
        ["address"],
        [bridge_logic_address],
        nonce,
        "set_bridge_address",
        asset_pool_instance.address);
    let encoded_hash = ethUtil.keccak256(encoded_message);

    let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);
    let sig_string = to_signature_string(signature);

    //NOTE Sig tests are in MultisigControl
    let receipt = await asset_pool_instance.set_bridge_address(bridge_logic_address, nonce, sig_string);
    return receipt;
}



////FUNCTIONS
contract("ETH_Bridge_Logic Function: set_deposit_minimum",  (accounts) => {
    //function set_deposit_minimum(address asset_source, uint256 asset_id, uint256 nonce, uint256 minimum_amount, bytes memory signatures) public;
    beforeEach(async()=>{
        await init_private_keys()
  
      });
      it("deposit minimum changes and is enforced by running set_deposit_minimum", async () => {
        let bridge_logic_instance = await ETH_Bridge_Logic.deployed();
  
        //Get minimum deposit
        let deposit_minimum = (await bridge_logic_instance.get_deposit_minimum()).toString();
        assert.equal(deposit_minimum,"0", "deposit min should be zero, isn't");
  
        //Set minimum deposit
        //NOTE signature tests are in MultisigControl
        let nonce = new ethUtil.BN(crypto.randomBytes(32));
        let encoded_message = get_message_to_sign(
            ["uint256"],
            [(5 * Math.pow(10, 18)).toString()],
            nonce,
            "set_deposit_minimum",
            ETH_Bridge_Logic.address);
        let encoded_hash = ethUtil.keccak256(encoded_message);
  
        let signature = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
        let sig_string = to_signature_string(signature);
  
        const tx = await bridge_logic_instance.set_deposit_minimum(parseEther('5'), nonce, sig_string);
        
        const {args} = await findEventInTransaction(tx, "ETH_Deposit_Minimum_Set");
  
        expectBignumberEqual(args.new_minimum, web3.utils.toWei('5', 'ether'));
        expectBignumberEqual(args.nonce, nonce);
  
        //Get minimum deposit, should be updated
        deposit_minimum = (await bridge_logic_instance.get_deposit_minimum()).toString();
        assert.equal(deposit_minimum, web3.utils.toWei('5', 'ether'), "deposit min should be 500, isn't");
  
        //deposit less that min should fail
        const depositAmount = web3.utils.toWei('2', 'ether');
        // check user has enough ETH in wallet
        expect(
            parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
            .to.be.greaterThanOrEqual(parseInt(formatEther(depositAmount))
            );
        
        try{
            await deposit_asset(bridge_logic_instance, accounts[0], depositAmount);
          assert.equal(
              true,
              false,
              "token deposit worked, shouldn't have"
          );
        } catch(e){}
  
        //deposit more that min should work
        expect(
            parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
            .to.be.greaterThanOrEqual(parseInt(formatEther(web3.utils.toWei('10', 'ether')))
            );

        await deposit_asset(bridge_logic_instance, accounts[0], web3.utils.toWei('10', 'ether'));
        
      });
})
