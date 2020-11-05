FROM mhart/alpine-node:12 AS builder
RUN mkdir /app
WORKDIR /app
ENV PATH="$PATH:/app/node_modules/.bin"
RUN apk update
RUN apk add ca-certificates curl
RUN \
	curl -sL -o /usr/local/bin/allmark https://github.com/andreaskoch/allmark/releases/download/v0.10.0/allmark_linux_amd64 && \
	sha256sum /usr/local/bin/allmark | grep -q '^c4dcf591f7fdcdfba349f4d97cd53bb03e4031b5fd9cc4820a736fa423eb01ef\b' && \
	chown root:root /usr/local/bin/allmark && \
	chmod 0755 /usr/local/bin/allmark
RUN apk add gcc g++ git make python3
RUN \
	npm install -g node-gyp@latest && \
	npm config set node_gyp "/usr/lib/node_modules/node-gyp/bin/node-gyp.js"
ADD package.json package-lock.json ./
RUN npm install

# # #

FROM mhart/alpine-node:12
RUN mkdir /app
WORKDIR /app
ENV PATH="$PATH:/app/node_modules/.bin"
RUN apk add --no-cache bash jq

COPY --from=builder /usr/local/bin/allmark /usr/local/bin/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

ADD truffle-config-docker.js ./truffle-config.js
ADD contracts ./contracts
ADD migrations ./migrations
ADD ecc_test.js ./
