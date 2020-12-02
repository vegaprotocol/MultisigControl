# Configure Validators/Signers

1. update `multisig_signers_[dev|stag|test].json` with the ethereum addresses available in:
    
    dev: https://github.com/vegaprotocol/devops-infra/blob/master/ansible/roles/vegaserver/files/home/vega/eth-indexed.txt-d.vega.xyz
    
    test: https://github.com/vegaprotocol/devops-infra/blob/master/ansible/roles/vegaserver/files/home/vega/eth-indexed.txt-testnet.vega.xyz
    
    stag: https://github.com/vegaprotocol/devops-infra/blob/master/ansible/roles/vegaserver/files/home/vega/eth-indexed.txt-s.vega.xyz 
1. from parent directory (`../`) run `node configure_multisig_signers.js --network ropsten --vega [dev|stag|test]`


# Delete Bridge Contracts
1. from parent directory (`../`) run `node kill_bridges.js --network ropsten --vega [dev|stag|test]`