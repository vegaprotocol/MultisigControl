
const hre = require("hardhat");
const contract_address= "0x124Dd8a6044ef048614AEA0AAC86643a8Ae1312D";

const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');


var abi = require('ethereumjs-abi');
var crypto = require("crypto");
var ethUtil = require('ethereumjs-util');
const mnemonic = fs.readFileSync("../.secret").toString().trim();
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const wallet = require('ethereumjs-wallet');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const { findEventInTransaction } = require('../../helpers/events');
const { expectBignumberEqual } = require("../../helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");


function to_signature_string(sig) {
  return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') + "" + sig.v.toString(16);
}

let private_keys = {};
async function init_private_keys() {
  private_keys = {};
  for (let key_idx = 0; key_idx < 10; key_idx++) {
    const seed = await bip39.mnemonicToSeed(mnemonic); // mnemonic is the string containing the words

    const hdk = hdkey.fromMasterSeed(seed);
    const addr_node = hdk.derivePath("m/44'/60'/0'/0/" + key_idx); //m/44'/60'/0'/0/0 is derivation path for the first account. m/44'/60'/0'/0/1 is the derivation path for the second account and so on
    const addr = addr_node.getWallet().getAddressString(); //check that this is the same with the address that ganache list for the first account to make sure the derivation is correct
    const private_key = addr_node.getWallet().getPrivateKey();
    private_keys[addr.toString("hex")] = private_key;
  }
}
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
async function list_asset(asset, bridge_logic_instance, from_address) {
  let new_asset_id = ethers.utils.keccak256(asset);
  let nonce =(ethers.BigNumber.from(crypto.randomBytes(32))).toString();
  let lifetime_limit =  ethers.utils.parseEther("1000");
  let withdraw_threshold = ethers.utils.parseEther("100");
  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "bytes32", "uint256", "uint256"],
    [asset, new_asset_id, lifetime_limit.toString(), withdraw_threshold.toString()],
    nonce,
    "list_asset",
    bridge_logic_instance.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.list_asset(asset, new_asset_id, lifetime_limit, withdraw_threshold, nonce, sig_string);
  return receipt
}

async function set_bridge_address(asset_pool_instance, bridge_logic_address, account) {
  let nonce = (ethers.BigNumber.from(crypto.randomBytes(32)))
  
  //create signature
  let encoded_message = get_message_to_sign(
    ["address"],
    [bridge_logic_address],
    nonce.toString(),
    "set_bridge_address",
    asset_pool_instance.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);
  
  
  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);

  let sig_string = to_signature_string(signature);
  let receipt = await asset_pool_instance.set_bridge_address(bridge_logic_address, nonce.toString(), sig_string);
  
  return receipt;
}




async function withdraw_asset(bridge_logic_instance, test_token_instance, account, amount) {
  let nonce =(ethers.BigNumber.from(crypto.randomBytes(32))).toString();
  let to_withdraw = amount
  let now = creation = ethers.BigNumber.from(Math.floor(Date.now() / 1000));

  let target = account;

  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "uint256", "address", "uint256"],
    [test_token_instance.address, to_withdraw, target, now.toString()],
    nonce,
    "withdraw_asset",
    bridge_logic_instance.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);
  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);

  let sig_string = to_signature_string(signature);

  let receipt = await bridge_logic_instance.withdraw_asset(test_token_instance.address, to_withdraw, target, creation, nonce, sig_string);
  return receipt;
}



const tether_abi = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress","type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee","type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser","type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}]


async function main() {

  /******* COPY CURRENT CONTRACTS ************/
  if(!fs.existsSync("./contracts")) {
    fs.mkdirSync("./contracts");
  }

  fsExtra.emptyDirSync("./contracts");    
  
  const source = "../contracts";
  const destination = "./contracts";
  fsExtra.copySync(source, destination);
  /********************************************/


  await init_private_keys();

  const initial_signer = await ethers.getSigner(0);
  const initial_address = await initial_signer.getAddress();
  console.log("Initial address: " + initial_address);

  //deploy multisig control
  const MultisigControl = await ethers.getContractFactory("MultisigControl");
  const multisig_control = await MultisigControl.deploy();
  await multisig_control.deployed();
  console.log("MultisigControl deployed to:", multisig_control.address);

  // deploy asset pool
  const AssetPool = await ethers.getContractFactory("ERC20_Asset_Pool");
  const asset_pool = await AssetPool.deploy(multisig_control.address);
  await asset_pool.deployed();
  console.log("AssetPool deployed to:", asset_pool.address);

  // deploy bridge logic
  const BridgeLogic = await ethers.getContractFactory("ERC20_Bridge_Logic_Restricted");
  const bridge_logic = await BridgeLogic.deploy(asset_pool.address);
  await bridge_logic.deployed();
  console.log("BridgeLogic deployed to:", bridge_logic.address);

  
  const tether_address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const tether_whale = "0xef0DCc839c1490cEbC7209BAa11f46cfe83805ab";
  
  /********config contracts* */
  // set asset pool's bridge logic
  console.log("Setting bridge address")
  await set_bridge_address(asset_pool, bridge_logic.address, initial_address);

  // list tether
  console.log("Listing tether")
  await list_asset(tether_address, bridge_logic, initial_address);

  // check that token_id is listed
  const is_listed = await bridge_logic.is_asset_listed(tether_address);
  console.log("Tether listed: " + is_listed);

  // impersonate tether issuer to issue tether to user
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [tether_whale],
  });
  const signer = await ethers.getSigner(tether_whale);
  
  const tether = new ethers.Contract(tether_address, tether_abi, signer);

  // check that signer has tether
  const tether_balance = await tether.balanceOf(tether_whale);


  // send bridge_address some ETH
  const tx = await network.provider.request({
    method: 'hardhat_setBalance',
    params: [tether_whale, '0xde0b6b3a7640000']
  });

  const random_vega_key = "0x" + crypto.randomBytes(32).toString('hex');

  console.log("Sending tether to asset pool")
  await tether.connect(signer).transfer(asset_pool.address, "10");

  console.log("Approving tether")
  let rx1 = await tether.connect(signer).approve(bridge_logic.address, ethers.utils.parseEther("100"));

  //balance before deposit
  const balance_before = await tether.balanceOf(asset_pool.address);
  console.log("Balance before deposit: " + balance_before.toString());

  console.log("Depositing tether")
  await bridge_logic.connect(signer).deposit_asset(tether_address, "1", random_vega_key);

  //balance after deposit
  const balance_after = await tether.balanceOf(asset_pool.address);
  console.log("Balance after deposit: " + balance_after.toString());

    /*withdraw_asset(
        address asset_source,
        uint256 amount,
        address target,
        uint256 creation,
        uint256 nonce,
        bytes memory signatures
    )*/

  // withdraw 1 tether from asset pool
  console.log("Withdrawing tether")
  await withdraw_asset(bridge_logic, tether, initial_address, "1");



  

  
  /*******delete local contracts*********/  
  fsExtra.emptyDirSync("./contracts");  

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});