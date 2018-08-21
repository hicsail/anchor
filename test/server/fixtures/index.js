'use strict';
//const Creds = require('./creds');
const Db = require('./db');
const Creds = require('./creds');
//const Hapi = require('./hapi');

class Fixtures {}

//Fixtures.Creds = Creds;
Fixtures.Db = Db;
Fixtures.Creds = Creds;
//Fixtures.Hapi = Hapi;

module.exports = Fixtures;
