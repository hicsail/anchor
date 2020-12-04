'use strict';
const Boom = require('boom');
const Config = require('../../config');
const IsAllowed = require('../helper/isAllowed');
const joiToJson = require('../helper/joiToJson');
const Joi = require('joi');

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/{collectionName}',
    options: {
      auth: {
        strategies: ['session']
      },
      pre: [{
        assign: 'model',
        method: async function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            throw Boom.notFound('Model not found');
          }

          return await model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.tableView.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.tableView.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
          }
          return h.continue;
        }
      }, {
        assign: 'validateoutputDataFields',
        method: function (request,h) {

          const model = request.pre.model;
          const outputDataFields = model.routes.tableView.outputDataFields;
          let validationSchema = model.routes.tableView.validationSchema;
          //console.log(Object.keys(server.plugins['hapi-anchor-model'].models[request.params.collectionName]))

          if (outputDataFields !== null) {
            for (let field in outputDataFields) {

              let obj = validationSchema.validate(outputDataFields[field]);
              if (obj.error) {
                console.log(obj.error.details[0].message);
                throw Boom.badRequest('outputDataFields violates the validation schema, ' + obj.error.details[0].message);
              }
            }
          }
          return h.continue;
        }
      }, {
        assign: 'scopeCheck',
        method: function (request, h) {
          const model = request.pre.model.routes.tableView.scope;
          const userRoles = request.auth.credentials.scope;
          if (!IsAllowed(userRoles, model)){
            throw Boom.unauthorized('Insufficient Scope');
          }
          return h.continue;
        }
      }
    ]},
    handler: async function (request, h) {

      const model = request.pre.model;
      let apiDataSource = model.routes.tableView.apiDataSourcePath;

      if (apiDataSource === '/api/table/{collectionName}') {
        apiDataSource = '/api/table/' + request.params.collectionName;
      }

      const req = {
        method: 'GET',
        url: apiDataSource,
        credentials: request.auth.credentials
      };

      const res = await server.inject(req);

      let outputCols = [];
      let outputData = res.result.data;

      if (model.routes.tableView.outputDataFields !== null) {

        let processedData = [];
        const fields = model.routes.tableView.outputDataFields;
        let unAddedKeys = new Set();

        for (let key of Object.keys(fields)){
          let userRoles = request.auth.credentials.scope;
          if (fields[key]['accessRoles'] && !IsAllowed(userRoles, fields[key]['accessRoles'])){//Blocks column option if user role is too low
            unAddedKeys.add(key);
            continue;
          }

          const col = {'label': fields[key]['label']};
          if (fields[key]['invisible']){
            col['invisible'] = true;
          }

          outputCols.push(col);
        }

        //modify fields to remove sensitive keys where user permission is too low.
        for (let key of Object.keys(fields)){
          if (unAddedKeys.has(key)){
            delete fields[key];
          }
        }
        for (let rec of outputData){
          let doc = {};
          for (let key of Object.keys(fields)) {
            if ('from' in fields[key]){
              if (rec[fields[key]['from']][key]) {
                doc[key] = rec[fields[key]['from']][key];
              }
              else{
                doc[key] = 'N/A';
              }
            }
            else {
              if (rec[key] === null || typeof rec[key] === 'undefined'){
                doc[key] = 'N/A';
              }
              else {
                doc[key] = rec[key];
              }
            }
          }
          processedData.push(doc);
        }
        outputData = processedData;
      }
      else {
        if (outputData.length !== 0 ) {
          //create the column headers for the database
          let modelsName = new Set(); //all the model names joined to this one
          model.lookups.forEach((lookup) => {//find all the secondary model joined.

            modelsName.add(lookup.as);
          });

          for (let key of Object.keys(outputData[0])) {
            if (!(modelsName.has(key))){//makes sure to not include secondary attached collection yet
              outputCols.push({label: key});
            }
          }

          model.lookups.forEach((lookup) => {//for each model save the label, set invisible and assign where it came from

            recursiveFindJoiKeys(lookup.from.schema).forEach((key) => {

              if (!(key in outputData[0])) {//checks that the key is not already a header.
                outputCols.push({label: key, invisible: true, from: lookup.as});
              }
            });
          });

          //process data coming from outputData based on the column headers given above.
          let processedData = [];
          outputData.forEach((data) => {

            let doc = {};
            outputCols.forEach((col) => {

              if ('from' in col){
                if (col.label in data[col.from]){
                  doc[col.label] = data[col.from][col.label];
                }
                else{
                  doc[col.label] = 'N/A';
                }
              }
              else{
                if (data[col.label] === null || typeof data[col.label] === 'undefined'){
                  doc[col.label] = 'N/A'
                }
                else{
                  doc[col.label] = data[col.label];
                }
              }
            });
            processedData.push(doc);
          });
          outputData = processedData;
        }
        else {
          for (let key of recursiveFindJoiKeys(model.schema)){
            outputCols.push({'label': key});
          }
        }
      }
      outputData.map((dataRow) => {//render function to change default string version of specified types.

        for (let key of Object.keys(dataRow)){
          if (dataRow[key] instanceof Date && !isNaN(dataRow[key])){ //check for JS Date Object.
            dataRow[key] = dataRow[key].toDateString() + ' ' + dataRow[key].toLocaleTimeString('en-us');//DOES NOT HAVE THE TIMEZONE...
          }
        }
      });

      return h.view('anchor-default-templates/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        baseUrl: Config.get('/baseUrl'),
        title:  capitalizeFirstLetter(request.params.collectionName),
        collectionName: request.params.collectionName,
        columns: outputCols,
        data: outputData
      });
    }
  });

  server.route({//returns the edit view template
    method: 'GET',
    path: '/edit/{collectionName}/{id}',
    options: {
      auth: {
        strategies: ['session']
      },
      pre: [{
        assign: 'model',
        method: async function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            throw Boom.notFound('Model not found');
          }

          return await model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.editView.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.editView.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
          }
          return h.continue;
        }
      }, {
        assign: 'scopeCheck',
        method: function (request, h) {
          const model = request.pre.model.routes.editView.scope;
          const userRoles = request.auth.credentials.scope;
          if (!IsAllowed(userRoles, model)){
            throw Boom.unauthorized('Insufficient Scope');
          }
          return h.continue;
        }
      }
    ]},
    handler: async function (request, h) {

      const model = request.pre.model;
      const schema = joiToJson(model.routes.editView.editSchema);

      const document = await model.findById(request.params.id);


      return h.view('anchor-default-templates/edit', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        baseUrl: Config.get('/baseUrl'),
        title: capitalizeFirstLetter(request.params.collectionName),
        collectionName: request.params.collectionName,
        editSchema: schema,
        doc: document
      });
    }

  });

  server.route({
    method: 'GET',
    path: '/create/{collectionName}',
    options: {
      auth: {
        strategies: ['session']
      },
      pre: [{
        assign: 'model',
        method: async function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            throw Boom.notFound('Model not found');
          }

          return await model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.createView.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.createView.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
          }
          return h.continue;
        }
      }, {
        assign: 'scopeCheck',
        method: function (request, h) {
          const model = request.pre.model.routes.createView.scope;
          const userRoles = request.auth.credentials.scope;
          if (!IsAllowed(userRoles, model)){
            throw Boom.unauthorized('Insufficient Scope');
          }
          return h.continue;
        }
      }
    ]},
    handler: async function (request, h) {
      const model = request.pre.model;
      const createView = model.routes.createView;
      let schema;
      if (createView.createSchema){
        schema = joiToJson(createView.createSchema);

      }
      else{
        model.routes.create.payload = model.schema;
        schema = joiToJson(model.schema);
        Object.entries(schema.properties).forEach( ([key, value]) => {
          if (!value || Object.keys(value).length === 0){
            delete schema.properties[key]
          }
        });
      }

      return h.view('anchor-default-templates/create', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        baseUrl: Config.get('/baseUrl'),
        title: capitalizeFirstLetter(request.params.collectionName),
        collectionName: request.params.collectionName,
        createSchema: schema
      });
    }
  });
};

function recursiveFindJoiKeys(joi, prefix = '') {
    const keys = []
    const children = joi && joi._inner && joi._inner.children
    if (Array.isArray(children)) {
        children.forEach(child => {
            keys.push(child.key)
            recursiveFindJoiKeys(child.schema, `${child.key}.`)
                .forEach(k => keys.push(k))
        })
    }
    return keys
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  name: 'anchor-web-route',
  register
};
