FROM node:8

WORKDIR /usr/src/anchor
COPY . .

RUN npm ci

EXPOSE 9000

CMD node server.js
