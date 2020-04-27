# MultisigControl

Terminal 1:

`npm install`

`npm run ganache`

Terminal 2:

`npm run migrate`

`node ecc_test.js`

NOTE: start on `line 58`

## Run in Docker

1. Build the docker container image: `make docker_build`
1. Run a container: `make docker_run`
1. (in a separate terminal) Tail the container logs: `docker logs -f multisigcontrol`
1. Run `ecc_test`: `make docker_ecc_test`
