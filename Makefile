# Makefile

IMAGE := docker.pkg.github.com/vegaprotocol/multisigcontrol/multisigcontrol:latest
CONTAINER := multisigcontrol

.PHONY: default
default: help

.PHONY: docker_pull
docker_pull: ## Pull docker image from github registry
	@docker pull "${IMAGE}"

.PHONY: docker_build
docker_build: ## Build local docker image
	@docker build -t "${IMAGE}" .

.PHONY: docker_push
docker_push: docker_build ## Push docker image to github image registry
	@docker push "${IMAGE}"

.PHONY: docker_run
docker_run: ## Run docker image
	@docker run -d --name=${CONTAINER} -p 8545:8545 "${IMAGE}"

.PHONY: docker_stop
docker_stop: ## Stop docker container
	@docker ps -q --filter name="${CONTAINER}" | xargs -r docker stop

.PHONY: docker_rm
docker_rm: ## Remove docker container
	@docker ps -qa --filter name="${CONTAINER}" | xargs -r docker rm

.PHONY: docker_stoprm
docker_stoprm: | docker_stop docker_rm ## Stop and remove docker container

.PHONY: docker_ecc_test
docker_ecc_test:
	docker exec -ti "$(CONTAINER)" npm run ecc_test

.PHONY: help
help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
