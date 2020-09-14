





//0xa675d020e1ff50455d1d9703915cf58eb940852f728f56513cb864cd3e1a0b59
//







/*

addr(0xA281f32aBa9d57Aa5ff842d030FE8eb4934BCc25) | assetId(0) | amount(1) | expiry(1599329244) | ethAddress(0xb89A165EA8b619c14312dB316BaAa80D2a98B493) |  nonce(1) | funcName(withdraw_asset)
buf(000000000000000000000000a281f32aba9d57aa5ff842d030fe8eb4934bcc2500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000005f53d3dc000000000000000000000000b89a165ea8b619c14312db316baaa80d2a98b493000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000e77697468647261775f6173736574000000000000000000000000000000000000) | bridgeAddr(0xf6C9d3e937fb2dA4995272C1aC3f3D466B7c23fC)
HASH: 84cb1e32b567f037424fc5583d499aea9ebb5168473645c847740a7aef29cf97
SIG: c2fe704da65e129bf5115ba0ea99be6b223986c42100786f73787ad34a8f209d63265f6cd9e0914f91228add2341f3632588bc28922342901ab4773459bcdaa901
 */





let ETH_BRIDGE_GANACHE_TEST_ADDRESS = '0x0858D9BD11A4F6Bae8b979402550CA6c6ddB8332';


// TODO: fix this
//ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"
let key1 = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;
//pk[0] = "0xadef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b";
//address[0] = "0xb89a165ea8b619c14312db316baaa80d2a98b493";

let key2 = Buffer.from("cb5a94687bda25561b2574ce062f0b055f9525c930b3fc9183c019c562b9c404", 'hex');
//pk[1] = 0xcb5a94687bda25561b2574ce062f0b055f9525c930b3fc9183c019c562b9c404;
//address[1] = 0x4ac2efe06b867213698ab317e9569872f8a5e85a;


var ethUtil = require('ethereumjs-util');
var abi = require('ethereumjs-abi');
var Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path')
MyContractJSON  = require(path.join(__dirname, 'build/contracts/MultisigControl.json'));
var Wallet = require('ethereumjs-wallet');
var crypto = require("crypto");



let eth_bridge_abi = require(path.join(__dirname, 'build/contracts/Vega_Bridge_ETH.json'));

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

// Import libraries


// Setup RPC connection
var provider = new Web3.providers.HttpProvider("http://localhost:8545");
let web3 = new Web3(provider);

// Read JSON and attach RPC connection (Provider)
var MyContract = contract(MyContractJSON);
MyContract.setProvider(provider);


eth_bridge = contract(eth_bridge_abi);
eth_bridge.setProvider(provider);




// Use Truffle as usual
eth_bridge.deployed().then(async function(instance) {
    const EthWallet1 = Wallet.fromPrivateKey(key1);
    const EthWallet2 = Wallet.fromPrivateKey(key2);
    let wallet1 = EthWallet1.getAddressString();
    console.log("wallet 1:" )
    console.log( wallet1);
    let wallet2 = EthWallet2.getAddressString();




    ////////////DEPOSIT
    let contract_balance_before = await web3.eth.getBalance(instance.address);
    console.log();
    console.log("contract balance before deposit: " + contract_balance_before);

    let deposit_receipt = await instance.deposit_asset("0x0000000000000000000000000000000000000000",0, 1, "0x01", {
        from: wallet1,
        value: 1});

    let deposit_event =deposit_receipt.logs[0].args;
    console.log("Amount: " + deposit_event.amount.toString());
    console.log("Vega Key: " + deposit_event.vega_public_key);
    console.log("Eth Sender: " + deposit_event.user_address);

    let contract_balance_after = await web3.eth.getBalance(instance.address);
    console.log("contract balance after deposit: " + contract_balance_after);
    console.log();

    //////////////WITHDRAW
    let nonce = new ethUtil.BN(crypto.randomBytes(32));
    let asset_source = "0x0000000000000000000000000000000000000000";
    let asset_id = 0;
    let amount = 1;
    let expiry = 1601104481;

    let encoded = get_message_to_sign(["address", "uint256", "uint256", "uint256", "address"], [asset_source, asset_id, amount, expiry, wallet1], nonce, "withdraw_asset", instance.address);
    let msgHash = ethUtil.keccak256(encoded);
    var sig = ethUtil.ecsign(msgHash, key1);

    let sig_string = "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
    var publicKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
    var sender = ethUtil.publicToAddress(publicKey)

    console.log()


    let contract_balance_before_w = await web3.eth.getBalance(instance.address);
    console.log("contract balance before deposit: " + contract_balance_before_w);
    let withdraw_receipt = await instance.withdraw_asset(asset_source, asset_id, amount, expiry, nonce, sig_string, {
        from: wallet1
    });
    let contract_balance_after_w = await web3.eth.getBalance(instance.address);
    console.log("contract balance after deposit: " + contract_balance_after_w);

})