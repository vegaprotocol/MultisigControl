# UI Samples
* Launch ganache `ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"`
* `../truffle migrate`
* unlock metamask
* import account with private key: `adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b`
* account should be: `0xb89a165ea8b619c14312db316baaa80d2a98b493`
* on Metamask network selector, select `localhost:8545`
* `npm install`
* `node server.js`
* navigate to `http://localhost:3000/ui_widgets.html`

# To generate pbf js (Windows instructions):
https://www.npmjs.com/package/grpc-web
https://github.com/protocolbuffers/protobuf/releases/latest
rename protoc-gen-grpc-web... to protoc-gen-grpc-web.exe (truncate rest of stuff)
CMD (NOT BASH): protoc multisig_api.proto --js_out=import_style=commonjs:generated --grpc-web_out=import_style=commonjs,mode=grpcwebtext:generated


