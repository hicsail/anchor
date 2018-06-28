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

  const anchorModels = models.reduce((accumulator, file) => {

    const model = require(Path.join(__dirname,modelPath,file));
    if (model.prototype instanceof AnchorModel) {
      accumulator.push(model);
    }
    return accumulator;
  },[]);

  server.expose('anchor-model', AnchorModel);

  server.ext({
    type: 'onPreStart',
    method: async function (_server) {

      if (options.hasOwnProperty('autoIndex') && options.autoIndex === false) {
        return;
      }

      const indexJobs = anchorModels
        .filter((model) => Boolean(model.indexes))
        .map((model) => model.createIndexes.bind(model, model.indexes));

      await Promise.all(indexJobs);

      server.log(['info', 'mongodb'], 'HapiAnchorModels: finished processing auto indexes.');
    }
  });

  server.ext({
    type: 'onPostStop',
    method: function (_server) {

      AnchorModel.disconnect();

      server.log(['info', 'mongodb'], 'HapiAnchorModels: closed db connection(s).');
    }
  });

  await AnchorModel.connect(options.mongodb.connection, options.mongodb.options);
  server.log(['info', 'mongodb'], 'HapiAnchorModels: successfully connected to the db.');

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
