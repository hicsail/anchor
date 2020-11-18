'use strict';
const AnchorModel = require('./anchor-model');
const Hoek = require('hoek');
const Fs = require('fs');
const Path = require('path');

const register = async function (server, options) {

  Hoek.assert(options.mongodb, 'options.mongodb is required');
  Hoek.assert(options.mongodb.connection, 'options.mongodb.connection is required');
  Hoek.assert(options.mongodb.connection.uri, 'options.mongodb.connection.uri is required');
  Hoek.assert(options.mongodb.connection.db, 'options.mongodb.connection.db is required');

  let modelPath = '../models/';

  if (options.path) {
    modelPath = options.path;
  }

  const models = await readDir(Path.join(__dirname,modelPath));

  const [anchorModels, collectionModels, collectionNames, sidebar] = models.reduce((accumulator, file) => {

    const model = require(Path.join(__dirname,modelPath,file));
    if (model.prototype instanceof AnchorModel) {
      accumulator[0].push(model);
      accumulator[1][model.collectionName] = model;
      accumulator[2].push(model.collectionName);
      //const sidebarOptions = model.sidebar;
      //sidebarOptions.collectionName = model.collectionName;
      //accumulator[3].push(sidebarOptions);

    }
    return accumulator;
  },[[],{},[],[]]);
  //console.log(collectionModels)
  
  //---------------------------CONSTRAINTS------------------------------
  const foreignKeyMappings = {};       
  for (let [collectionName, collection] of Object.entries(collectionModels)) {
    if (collection['constraints']) {
      for (let constraint of collection['constraints']) { 

        let referencingInfo = {
          'onDelete': constraint['onDelete'], 
          'onUpdate': constraint['onUpdate'], 
          'foreignKey': constraint['foreignKey'], 
          'childTable': collection          
        };      

        if (constraint['parentTable']['collectionName'] in foreignKeyMappings) {
          foreignKeyMappings[constraint['parentTable']['collectionName']]['referencingInfo'].push(referencingInfo);
        }
        else {
          foreignKeyMappings[constraint['parentTable']['collectionName']] = {'referencingInfo': [referencingInfo], 'restrictUpdate': false, 'restrictDelete': false};
          //foreignKeyMappings[constraint['parentTable']['collectionName']] = [referencingInfo];
        }
        if (constraint['onDelete'] === 'NO-ACTION' || constraint['onDelete'] === 'RESTRICT')
          foreignKeyMappings[constraint['parentTable']['collectionName']]['restrictDelete'] = true;
        if (constraint['onUpdate'] === 'NO-ACTION' || constraint['onUpdate'] === 'RESTRICT')
          foreignKeyMappings[constraint['parentTable']['collectionName']]['restrictUpdate'] = true;                        
      }
    }
  }
  //---------------------------------------------------------------------------------
  server.expose('models',collectionModels);
  server.expose('constraints', foreignKeyMappings);
  server.expose('anchorModel', AnchorModel);
  server.expose('modelsArray', anchorModels);
  server.expose('collectionNames', collectionNames);
  //server.expose('sidebar', sidebar);

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
  AnchorModel.constraints = foreignKeyMappings;
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
  register,
  readDir
};

exports.register = register;

