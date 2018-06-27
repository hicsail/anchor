'use strict';
const AnchorModel = require('./anchor-model');
const Hoek = require('hoek');
const Fs = require('fs');
const Path = require('path');

const modelPath = '../models/';

const register = async function (server, options) {

  Hoek.assert(options.mongodb, 'options.mongodb is required');
  Hoek.assert(options.mongodb.connection, 'options.mongodb.connection is required');
  Hoek.assert(options.mongodb.connection.uri, 'options.mongodb.connection.uri is required');
  Hoek.assert(options.mongodb.connection.db, 'options.mongodb.connection.db is required');

  const models = await readDir(Path.join(__dirname,modelPath));

  console.log(models);

  server.expose('anchor-model', AnchorModel);

};

const readDir = (path, opts = 'utf8') =>

  new Promise((res, rej) => {

    Fs.readdir(path, opts, (err, data) => {

      if (err) {
        rej(err);
      }
      else {
        res(data);
      }
    });
  });

module.exports = {
  name: 'hapi-anchor-model',
  register
};

exports.register = register;
