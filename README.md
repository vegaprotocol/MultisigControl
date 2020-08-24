# MultisigControl

Terminal 1:

`npm install`

`ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"`

Terminal 2:

`truffle migrate`

`node ecc_test.js`


## Run in Docker

1. Build the docker container image: `make docker_build`
1. Run a container: `make docker_run`
1. (in a separate terminal) Tail the container logs: `docker logs -f multisigcontrol`
1. Run `ecc_test`: `make docker_ecc_test`
