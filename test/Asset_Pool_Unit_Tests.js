const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");

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

////FUNCTIONS
contract("ERC20_Bridge_Logic Function: set_multisig_control",  (accounts) => {
    //function set_multisig_control(address new_address, uint256 nonce, bytes memory signatures) public {
    it("set_multisig_control", async () => {});
});

contract("ERC20_Bridge_Logic Function: set_bridge_address",  (accounts) => {
    //function set_bridge_address(address new_address, uint256 nonce, bytes memory signatures) public {
    it("set_bridge_address", async () => {});
});
contract("ERC20_Bridge_Logic Function: withdraw",  (accounts) => {
    //function withdraw(address token_address, address target, uint256 amount) public returns(bool){
    it("withdraw", async () => {});
});


////VIEWS
contract("ERC20_Bridge_Logic Function: multisig_control_address",  (accounts) => {
    //address public multisig_control_address;
    it("multisig_control_address", async () => {});
});
contract("ERC20_Bridge_Logic Function: erc20_bridge_address",  (accounts) => {
    //address public erc20_bridge_address;
    it("erc20_bridge_address", async () => {});
});