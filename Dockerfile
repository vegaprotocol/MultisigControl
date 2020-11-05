FROM node:12-stretch
RUN mkdir /app
WORKDIR /app
ENV PATH="$PATH:/app/node_modules/.bin"
RUN apt update && apt install -y --no-install-recommends jq
RUN \
	curl -sL -o /usr/local/bin/allmark https://github.com/andreaskoch/allmark/releases/download/v0.10.0/allmark_linux_amd64 && \
	sha256sum /usr/local/bin/allmark | grep -q '^c4dcf591f7fdcdfba349f4d97cd53bb03e4031b5fd9cc4820a736fa423eb01ef\b' && \
	chown root:root /usr/local/bin/allmark && \
	chmod 0755 /usr/local/bin/allmark
ADD package.json package-lock.json ./
RUN npm install
ADD truffle-config-docker.js ./truffle-config.js
ADD contracts ./contracts
ADD migrations ./migrations
ADD ecc_test.js ./
