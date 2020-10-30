FROM node:12-stretch
RUN mkdir /app
WORKDIR /app
ENV PATH="$PATH:/app/node_modules/.bin"
ADD package.json package-lock.json ./
RUN npm install
ADD truffle-config-docker.js ./truffle-config.js
ADD contracts ./contracts
ADD migrations ./migrations
ADD ecc_test.js ./
