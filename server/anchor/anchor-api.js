'use strict';
const Boom = require('boom');
const Joi = require('joi');

const register = function (server,serverOptions) {


  server.route({
    method: 'GET',
    path: '/simple',
    options: {
      auth: false
    },
    handler: async function (request,h) {

      try {
        await request.server.auth.test('simple',request);
        return { isValid: true };
      }
      catch (err) {
        return { isValid: false };
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/session',
    options: {
      auth: false,
      plugins: {
        'hapi-auth-cookie': {
          redirectTo:false
        }
      }
    },
    handler: async function (request,h) {

      try {
        await request.server.auth.test('session',request);

        return { isvalid: true };

      }

      catch (err) {

        return { isValid: false };
      }
    }
  });

  server.route({
    method: 'POST',
    path:'/api/{collectionName}',
    config: {
      pre: [{
        assign: 'model',
        method: function (request,h) {

          console.log('hello');
          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            return Boom.notFound('Model not found');
          }

          return model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          console.log('step two');
          const model = request.pre.model;
          if (model.routes.create.disabled) {
            return (Boom.notFound('Permission Denied: Route Disabled'));
          }

          return (true);
        },
        assign: 'auth',
        method: async function (request,h) {

          const model = request.pre.model;
          console.log(model.routes.create.auth);
          if (model.routes.create.auth) {

            const req = {
              method: 'GET',
              url: '/simple'

            };

            const response = await server.inject(req);
            console.log('HELLO');
            console.log(response.result.isValid);
            if (!response.result.isValid) {
              return Boom.notFound('Authentication Invalid');
            }

            return true;


          }
        },
        assign: 'payload',
        method: function (request,h) {

          const model = request.pre.model;
          return Joi.validate(request.payload,model.routes.create.payload);

        }
      }]
    },
    handler: async function (request,h) {

      return await request.pre.model.routes.create.handler(request,h);
    }


  });

  server.route({
    method: 'GET',
    path: '/api/{collectionName}/{id}',
    config: {
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            return Boom.notFound('Model not found');
          }

          return model;
        }
      }, {

        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.getId.disabled) {
            return Boom.notFound('Permission Denied: Route Disabled');
          }

          return true;
        }
      }]
    },
    handler: async function (request,h) {

      return await request.pre.model.routes.getId.handler(request,h);
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/{collectionName}/{id}',
    config: {
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            return Boom.notFound('Model not found');
          }

          return model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.delete.disabled) {
            return Boom.notFound('Permission Denied: Route Disabled');
          }
          return true;
        }
      }]
    },
    handler: async function (request,h) {

      return await request.pre.model.routes.delete.handler(request,h);
    }
  });

  server.route({
    method:'PUT',
    path: '/api/{collectionName}/{id}',
    config: {
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            return Boom.notFound('Model not found');
          }

          return model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.update.disabled) {
            return (Boom.notFound('Permission Denied: Route Disabled'));
          }

          return (true);
        },
        assign: 'payload',
        method: function (request,h) {

          const model = request.pre.model;
          return Joi.validate(request.payload,model.routes.update.payload);
        }
      }]
    },
    handler: async function (request,h) {

      return await request.pre.model.routes.update.handler(request,h);
    }
  });



  server.route({
    //paged find
    method:'GET',
    path:'/api/{collectionName}',
    config: {
      validate: {
        query: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      },
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];
          if (!model) {
            return (Boom.notFound('Model not found'));
          }
          return model;

        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.get.disabled) {
            return (Boom.notFound('Permission Denied: Route Disabled'));
          }

          return (true);
        }
      }]

    },
    handler: async function (request,h) {

      return await request.pre.model.routes.getAll.handler(request,h);
    }
  });
};



module.exports = {
  name: 'anchor-api',
  dependencies: [
    'auth',
    'hapi-anchor-model'
  ],
  register
};



