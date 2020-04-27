FROM node:10-stretch
EXPOSE 8545
ENTRYPOINT ["/app/run"]
RUN mkdir /app
WORKDIR /app
ENV PATH="$PATH:/app/node_modules/.bin"
ADD package.json package-lock.json ./
RUN npm install
ADD truffle-config.js ./
ADD contracts ./contracts
ADD migrations ./migrations
ADD ecc_test.js ./
ADD run ./
