'use strict';
const Boom = require('boom');
const Config = require('../../config');
const IsAllowed = require('../helper/isAllowed');
const Joi = require('joi');
const getRoleNames = require('../helper/getRoleNames');

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
          //
          const keys = new Set(recursiveFindJoiKeys(model.schema));
          const fromKeys = new Set();
          for (let lookup of model.lookups) {
            const nestedKeys = (recursiveFindJoiKeys(lookup.from.schema));
            nestedKeys.forEach(key => keys.add(key))
            fromKeys.add(lookup.as);
          }

          if (outputDataFields !== null) {
              for (const [field, value] of Object.entries(outputDataFields)) {

              if (!keys.has(field)) {
                throw Boom.badRequest('Key ' + field + ' is not valid');
              }

                console.log(value.from);
              if (value.from != null && !fromKeys.has(value.from)) {
                throw Boom.badRequest('The from value ' + field['from'] + ' is not valid');
              }

              //validate accessroles exist in the roles object
              const roleNames = new Set(getRoleNames);
              if (value.accessRoles != null) {
                for (let role of value['accessRoles']) {
                  console.log(role);
                  if (!roleNames.has(role)) {
                    throw Boom.badRequest('listed role "' + role + '" does not exist');
                  }
                }
              }

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
      ]
    },
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

        for (let key in fields) {

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
        for (let key in fields){
          if (unAddedKeys.has(key)){
            delete fields[key];
          }
        }

        for (let rec of outputData){
          let doc = {};
          for (let key in fields) {
            if (fields[key]['from']) {
              doc[key] = rec[fields[key]['from']][key];
            }
            else {
              doc[key] = rec[key];
            }
          }
          processedData.push(doc);
        }
        outputData = processedData;

      }
      else {
        if (outputData.length !== 0 ) {
          for (let key of Object.keys(outputData[0])) {
            outputCols.push({'label': key});
          }
        }
        else {
          for (let key of recursiveFindJoiKeys(model.schema)){
            outputCols.push({'label': key});
          }
        }
      }

      return h.view('anchor-default-templates/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        baseUrl: Config.get('/baseUrl'),
        title:  capitalizeFirstLetter(request.params.collectionName),
        columns: outputCols,
        data: outputData
      });
    }
  });

  server.route({//returns the edit view template
    method: 'GET',
    path: '/edit/{collectionName}/{id}',options: {
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
          if (model.routes.create.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'payload',
        method: function (request,h) {

          const model = request.pre.model;
          const { error, value } = Joi.validate(request.payload,model.routes.create.payload);

          if (error) {
            throw Boom.badRequest('Incorrect Payload', error);
          }
          request.payload = value;
          return h.continue;
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.create.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
          }
          return h.continue;
        }
      }, {
        assign: 'scopeCheck',
        method: function (request, h) {
          const model = request.pre.model.routes.tableView.scope;
          const userRoles = request.auth.credentials.scope;
          if (!IsAllowed(userRoles, model)) {
            throw Boom.unauthorized('Insufficient Scope');
          }
          return h.continue;
        }
      }
      ]
    },
    handler: async function (request, h) {

      return h.view('dummy');
    }

  });

  server.route({//returns the table view template
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
          if (model.routes.create.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'payload',
        method: function (request,h) {

          const model = request.pre.model;
          const { error, value } = Joi.validate(request.payload,model.routes.create.payload);

          if (error) {
            throw Boom.badRequest('Incorrect Payload', error);
          }
          request.payload = value;
          return h.continue;
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.create.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
          }
          return h.continue;
        }
      }, {
        assign: 'scopeCheck',
        method: function (request, h) {
          const model = request.pre.model.routes.tableView.scope;
          const userRoles = request.auth.credentials.scope;
          if (!IsAllowed(userRoles, model)) {
            throw Boom.unauthorized('Insufficient Scope');
          }
          return h.continue;
        }
      }
      ]
    },
    handler: async function (request, h) {

      return h.view('dummy')
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
