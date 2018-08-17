# Anchor

[![CircleCI](https://circleci.com/gh/hicsail/anchor/tree/master.svg?style=svg)](https://circleci.com/gh/hicsail/anchor/tree/master)
[![Build Status](https://travis-ci.org/hicsail/anchor.svg?branch=master)](https://travis-ci.org/hicsail/anchor)
[![Dependency Status](https://img.shields.io/david/hicsail/anchor.svg)](https://david-dm.org/hicsail/anchor)
[![devDependency Status](https://img.shields.io/david/dev/hicsail/anchor.svg)](https://david-dm.org/hicsail/anchor?type=dev)
[![Coverage Status](https://coveralls.io/repos/github/hicsail/anchor/badge.svg?branch=master)](https://coveralls.io/github/hicsail/anchor?branch=master)

A user system API starter with a database administrative system. Bring your own front-end.

## Features

 - Login system with forgot password and reset password
 - Abusive login attempt detection
 - User roles for analysts, clinicians, researchers, admins
 - Analyst can view anonymized information
 - Clinician can view information of specific users
 - Researcher can view all information
 - Admins can view update and delete all information
 - Auto Backups
 - Admin UI to view Database Records
 - Custom Event Tracking
 - User Feedback System
 - Email Invites
 - API Tokens


## Technology

Anchor is built with the [hapi](https://hapijs.com/) framework. We're
using [MongoDB](http://www.mongodb.org/) as a data store. This project 
was originally a fork from [Frame](https://github.com/jedireza/frame)


## Live demo

| url                                                                        | username | password |
|:-------------------------------------------------------------------------- |:-------- |:-------- |
| [https://getframe.herokuapp.com/](https://getframe.herokuapp.com/)         | root     | root     |
| [https://getframe.herokuapp.com/docs](https://getframe.herokuapp.com/docs) | ----     | ----     |

[Postman](http://www.getpostman.com/) is a great tool for testing and
developing APIs. See the wiki for details on [how to
login](https://github.com/jedireza/frame/wiki/How-to-login).


## Requirements

You need [Node.js](http://nodejs.org/download/) installed and you'll need
[MongoDB](http://www.mongodb.org/downloads) installed and running.

We use [`bcrypt`](https://github.com/ncb000gt/node.bcrypt.js) for hashing
secrets. If you have issues during installation related to `bcrypt` then [refer
to this wiki
page](https://github.com/jedireza/frame/wiki/bcrypt-Installation-Trouble).


## Installation

```bash
$ git clone git@github.com:hicsail/anchor.git
$ cd anchor
$ npm install
```


## Configuration

Simply edit `config.js`. The configuration uses
[`confidence`](https://github.com/hapijs/confidence) which makes it easy to
manage configuration settings across environments. __Don't store secrets in
this file or commit them to your repository.__

__Instead, access secrets via environment variables.__ We use
[`dotenv`](https://github.com/motdotla/dotenv) to help make setting local
environment variables easy (not to be used in production).

Simply copy `.env-sample` to `.env` and edit as needed. __Don't commit `.env`
to your repository.__


## First time setup

__WARNING__: This will clear all data in the following MongoDB collections if
they exist: `authAttempts`, `backups`, `events`, `feedback`, `invite`,
`sessions`, `tokens`, and `users`.

```bash
$ npm run first-time-setup

# > anchor@0.0.0 first-time-setup /home/hicsail/projects/anchor
# > node first-time-setup.js

# MongoDB URL: (mongodb://localhost:27017/anchor)
# Root user email: jedireza@gmail.com
# Root user password:
# Setup complete.
```


## Running the app

```bash
$ npm start

# > anchor@0.0.0 start /Users/hicsail/projects/anchor
# > ./node_modules/nodemon/bin/nodemon.js -e js,md server

# 09 Sep 03:47:15 - [nodemon] v1.10.2
# ...
```

Now you should be able to point your browser to http://127.0.0.1:9000/ and
see the welcome message.

[`nodemon`](https://github.com/remy/nodemon) watches for changes in server
code and restarts the app automatically.

We also pass the `--inspect` flag to Node so you have a debugger available.
Watch the output of `$ npm start` and look for the debugging URL and open it in
Chrome. It looks something like this:

`chrome-devtools://devtools/remote/serve_file/@62cd277117e6f8ec53e31b1be58290a6f7ab42ef/inspector.html?experiments=true&v8only=true&ws=localhost:9229/node`


## Running in production

```bash
$ node server.js
```

Unlike `$ npm start` this doesn't watch for file changes. Also be sure to set
these environment variables in your production environment:

 - `NODE_ENV=production` - This is important for many different
   optimizations.
 - `NPM_CONFIG_PRODUCTION=false` - This tells `$ npm install` to not skip
   installing `devDependencies`, which we may need to run the first time
   setup script.
   
## Running with Docker

Running with [Docker](https://www.docker.com/) and 
[Docker Compose](https://docs.docker.com/compose/) is quick and easy. Just run

```bash
$ docker-compose up --build
```

Docker compose will download MongoDB and Node.js into containers and start 
running the application in production mode.


## Have a question?

Any issues or questions (no matter how basic), open an issue. Please take the
initiative to read relevant documentation and be pro-active with debugging.


## Want to contribute?

Contributions are welcome. If you're changing something non-trivial, you may
want to submit an issue before creating a large pull request.


## Running tests

[Lab](https://github.com/hapijs/lab) is part of the hapi ecosystem and what we
use to write all of our tests.

```bash
$ npm test

# > anchor@0.0.0 test /Users/hicsail/projects/anchor
# > ./node_modules/lab/bin/lab -c

# ..................................................
# ..................................................
# ..................................................
# ..................................................
# ..................................................
# ..................................................
# ..................................................
# .........

# 359 tests complete
# Test duration: 3062 ms
# No global variable leaks detected
# Coverage: 100.00%
# Linting results: No issues
```

## License

MIT
