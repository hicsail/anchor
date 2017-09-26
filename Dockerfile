FROM ubuntu:16.04
FROM mongo:3.4.5
FROM node:8

WORKDIR /usr/src/anchor
COPY . /usr/src/anchor/

RUN apt-get update

#Needed to connect to MongoDB
RUN apt-get install -y netcat

RUN npm install

EXPOSE 9000

CMD sh docker_run.sh
