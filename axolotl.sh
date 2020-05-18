#!/bin/bash

# This script is used to pull, stop and start containers
#
# Definitions:
# - "others" - all containers other than multisigcontrol
others=(bridge_vega_consensus_sim event_queue bridge_bots)

imgbase=docker.pkg.github.com/vegaprotocol
dockernet=axolotl

help() {
	echo "Command line arguments:"
	echo
	echo "  -n  Do not pull containers (for when building+testing locally builds)"
	echo "  -R  Restart all containers"
	echo "  -r  Restart 'other' containers (i.e. all excluding multisigcontrol)"
	echo "  -S  Stop all containers"
	echo "  -h  Show this help"
}

docker_pull() {
	local ctr img
	ctr="$1"
	img="$imgbase/$ctr/$ctr:latest"
	if test "$pull" == yes ; then
		echo "Pulling $img"
		if ! docker pull "$img" ; then
			echo "Failed to pull $img"
			exit 1
		fi
	else
		echo "NOT Pulling $img"
	fi
}

docker_stoprm() {
	local ctr
	ctr="${1//_/-}"
	echo "Stopping and removing: $ctr"
	docker ps -q --filter "name=$ctr" | xargs -r docker stop
	docker ps -qa --filter "name=$ctr" | xargs -r docker rm
}

pull_multisigcontrol() {
	docker_pull multisigcontrol
}

pull_others() {
	local ctr
	for ctr in "${others[@]}" ; do
		docker_pull "$ctr"
	done
}

restart_all() {
	pull_multisigcontrol
	pull_others

	stop_others
	stop_multisigcontrol

	start_dockernet
	start_multisigcontrol
	start_others
}

restart_others() {
	pull_others

	stop_others

	start_others
}

start_dockernet() {
	if ! docker network ls -q --filter "name=$dockernet" | grep -q '^[0-9a-f]' ; then
		echo "Starting dockernet $dockernet"
		docker network create --driver bridge "$dockernet"
	fi
}

start_multisigcontrol() {
	local ctr img
	ctr=multisigcontrol
	img="$imgbase/$ctr/$ctr:latest"
	echo "Starting: $ctr"
	docker run -d \
		--name "$ctr" \
		--net "$dockernet" \
		--tmpfs /tmp \
		-p 0.0.0.0:8545:8545 \
		"$img"
	echo "Waiting for $ctr"
	while ! docker logs "$ctr" 2>/dev/null | grep -q '^Waiting \.\.\.$' ; do
		echo "."
		sleep 1
	done
	echo "OK"
}

start_others() {
	start_bridge_vega_consensus_sim
	start_event_queue
	start_bridge_bots
}

start_bridge_vega_consensus_sim() {
	local ctr img
	ctr=bridge_vega_consensus_sim
	img="$imgbase/$ctr/$ctr:latest"
	ctr="${ctr//_/-}"
	echo "Starting: $ctr"
	docker run -d \
		--name "$ctr" \
		--net "$dockernet" \
		-p 0.0.0.0:4000:4000 \
		-p 0.0.0.0:50051:50051 \
		-p 0.0.0.0:50055:50055 \
		"$img"
}

start_event_queue() {
	local ctr img
	ctr=event_queue
	img="$imgbase/$ctr/$ctr:latest"
	ctr="${ctr//_/-}"
	echo "Starting: $ctr"
	docker run -d \
		--name "$ctr" \
		--net "$dockernet" \
		"$img"
}

start_bridge_bots() {
	local ctr img
	ctr=bridge_bots
	img="$imgbase/$ctr/$ctr:latest"
	ctr="${ctr//_/-}"
	echo "Starting: $ctr"
	docker run -d \
		--name "$ctr" \
		--net "$dockernet" \
		"$img"
}

stop_multisigcontrol() {
	docker_stoprm multisigcontrol
}

stop_others() {
	for ctr in "${others[@]}" ; do
		docker_stoprm "$ctr"
	done
}

# # #

# set defaults
pull=yes

while getopts 'nRrSh' flag; do
	case "$flag" in
	n)
		pull=no
		;;
	R)
		restart_all
		;;
	r)
		restart_others
		;;
	S)
		stop_others
		docker_stoprm multisigcontrol
		;;
	h)
		help
		exit 0
		;;
	*)
		echo "Invalid option: $flag"
		exit 1
		;;
	esac
done
