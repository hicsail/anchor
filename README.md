# Anchor

[![CircleCI](https://circleci.com/gh/hicsail/anchor/tree/master.svg?style=svg)](https://circleci.com/gh/hicsail/anchor/tree/master)
[![Build Status](https://travis-ci.org/hicsail/anchor.svg?branch=master)](https://travis-ci.org/hicsail/anchor)
[![Dependency Status](https://img.shields.io/david/hicsail/anchor.svg)](https://david-dm.org/hicsail/hicsail-mongo-models)
[![devDependency Status](https://img.shields.io/david/dev/hicsail/anchor.svg)](https://david-dm.org/hicsail/hicsail-mongo-models?type=dev)
[![Coverage Status](https://coveralls.io/repos/github/hicsail/anchor/badge.svg?branch=master)](https://coveralls.io/github/hicsail/anchor?branch=master)

A user system API starter with a database administrative system. Bring your own front-end.

## Default API functionalities supported by anchor

Anchor supports the follwoing API functionalties for every database collection model being exposed to the server so that you don't have to write any code for these basic functionalties including basic database CRUD operations unless you need to add custom code to them.

All the model classes inside `/server/models` directory must have a static property called collectionName having a unique string value and when triggering the default API routes for any of the models, the actual value this static property, collectionName holds must replace the path parameter, {collectionName} in the route url.

For example you can retrieve all the users data in 'users' collection by making an AJAX call to `/api/table/users`.

| Name | Path | Method |Functionality
|:-----|:--------: |:--------: |:-------- |
|getAllTable| `/api/table/{collectionName}` | GET | Returns all the documments in the collection along with the metadata [recordsFiltered, recordsTotal, draw] required for rendering datatable on the UI |
|getAll| `/api/{collectionName}` | GET | Returns all the documments in the collection |
|create| `/api/{collectionName}` | POST | Inserts a new document (payload) into the collection  |
|insertMany| `/api/{collectionName}/insertMany` | POST | Inserts a couple of documnts (payload) into the collection |
|update| `/api/{collectionName}/{id}`| PUT | Updates the document with _id equal to {id} embedded in the path |
|delete| `/api/{collectionName}/{id}` | DELETE | Deletes the document with _id equal to {id} embedded in the path |
|getId| `/api/{collectionName}/{id}`| GET | Finds and returns the document with _id equal to {id} embedded in the path |
|getMy|`/api/{collectionName}/my` | GET | Finds and returns the all documents in the collection with userId equal to the _id of the logged in user in Users collection (all the documents in the collection created by the logged in user 

If you need to customize any of these functionalities and write your own code for any of the routes above, you need to disable the default routes by overriding the default value of 'routes' static property of AnchorModels base class like this: 

![hoek](https://user-images.githubusercontent.com/32320836/93406070-c42a2f00-f85c-11ea-9225-62ae35da47e6.png)

##User Roles 

You can add user roles to the config file. The strcture of user roles in the config file is as follows:

![roles](https://user-images.githubusercontent.com/32320836/93408106-bf1bae80-f861-11ea-9996-e9166c2439f1.png)

Eahc role object in the config file must have a unique name and integer access level. They also could have an optional type property. The value of type could be either 'groupAdmin' or 'ordinary'. If the type property of a role is set to 'groupAdmin', then it means the corresponding role manages only a group of users.

If a role is of type 'groupAdmin', they can only update or delete the documents whose creator users exist in the user access array of the admin with role.
Anchor looks at all the roles in config file and for those having type of 'groupAdmin' automatically create Fields on the UI for updating their user access.[sreenshot to be added]

## Features

 - Login system with forgot password and reset password
 - Abusive login attempt detection 
 - Customizable user roles 
 - Curstomizable scopes for routes 
 - Auto Backups
 - Admin UI to view Database Records
 - Admin UI to update route scopes
 - Admin UI to update user roles 
 - Admin UI to update user Access of different user group admins
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
