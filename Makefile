# Makefile

.PHONY: default
default: docker_build

.PHONY: docker_build
docker_build: ## Build local docker image
	docker build -t docker.pkg.github.com/vegaprotocol/multisigcontrol/multisigcontrol:local .
