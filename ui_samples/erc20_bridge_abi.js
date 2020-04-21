erc20_bridge_abi = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "nonce",
                "type": "uint256"
            }
        ],
        "name": "Asset_Blacklisted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "new_minimum",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "nonce",
                "type": "uint256"
            }
        ],
        "name": "Asset_Deposit_Minimum_Set",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user_address",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "vega_public_key",
                "type": "bytes32"
            }
        ],
        "name": "Asset_Deposited",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "nonce",
                "type": "uint256"
            }
        ],
        "name": "Asset_Whitelisted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user_address",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "nonce",
                "type": "uint256"
            }
        ],
        "name": "Asset_Withdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "multisig_control_source",
                "type": "address"
            }
        ],
        "name": "Multisig_Control_Set",
        "type": "event"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "nonce",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "signatures",
                "type": "bytes"
            }
        ],
        "name": "whitelist_asset",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "nonce",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "signatures",
                "type": "bytes"
            }
        ],
        "name": "blacklist_asset",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "nonce",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "minimum_amount",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "signatures",
                "type": "bytes"
            }
        ],
        "name": "set_deposit_minimum",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "nonce",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "signatures",
                "type": "bytes"
            }
        ],
        "name": "withdraw_asset",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "vega_public_key",
                "type": "bytes32"
            }
        ],
        "name": "deposit_asset",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "new_multisig_contract_address",
                "type": "address"
            }
        ],
        "name": "set_multisig_control",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            }
        ],
        "name": "is_asset_whitelisted",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "address",
                "name": "asset_source",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "asset_id",
                "type": "uint256"
            }
        ],
        "name": "get_deposit_minimum",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "get_multisig_control_address",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];