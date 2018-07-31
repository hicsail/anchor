'use strict';
const Boom = require('boom');
const Joi = require('joi');

const register = function (server,serverOptions) {



  server.route({
    method: 'POST',
    path:'/api/{collectionName}',
    options: {
      auth: {
        strategies: ['session','simple'],
        mode: 'try'
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

            throw (Boom.notFound('Permission Denied: Route Disabled'));
          }

          return h.continue;

        }
      }, {
        assign: 'payload',
        method: function (request,h) {

          const model = request.pre.model;

          return Joi.validate(request.payload,model.routes.create.payload);
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.create.auth) {

            if (!request.auth.isAuthenticated) {

              throw Boom.notFound('Authentication Required');
            }


          }

          return h.continue;
        }
      }
      ]
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

          return h.continue;
        }
      }, {
        assign: 'basic',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.getId.auth) {
            return await server.auth.test('simple',request);
          }

          h.continue;

        }
      }, {
        assign: 'cookie',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.getId.auth) {
            return await server.auth.test('session',request);
          }
          return h.continue;
        }
      }, {
        assign: 'credentials',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.getId.auth) {



            if (request.pre.cookie || request.pre.basic) {

              return await request.pre.cookie || request.pre.basic;
            }

            throw Boom.notFound('Authorization denied');
          }

          else {

            return h.continue;
          }
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
          return h.continue;
        }
      }, {
        assign: 'basic',
        method: async function (request,h) {

          const model = request.pre.model;
          if (model.routes.delete.auth) {

            return await server.auth.test('simple',request);
          }

          return h.continue;
        }
      }, {
        assign: 'cookie',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.delete.auth) {

            return await server.auth.test('session',request);
          }

          return h.continue;
        }
      }, {

        assign: 'credentials',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.delete.auth) {
            if (request.pre.cookie || request.pre.basic) {

              return request.pre.cookie || request.pre.basic;
            }

            throw Boom.notFound('Authorization Denied');
          }
          else {
            return h.continue;
          }
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

          return h.continue;
        }
      }, {
        assign: 'payload',
        method: function (request,h) {

          const model = request.pre.model;
          return Joi.validate(request.payload,model.routes.update.payload);
        }
      },
      {
        assign: 'basic',
        method: async function (request,h) {

          const model = request.pre.model;
          if (model.routes.update.auth) {

            return await server.auth.test('simple',request);
          }

          return h.continue;
        }
      }, {
        assign: 'cookie',
        method: async function (request,h) {

          const model = request.pre.model;
          if (model.routes.update.auth) {

            return await server.auth.test('cookie',request);
          }

          return h.continue;
        }



      }, {

        assign: 'credentials',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.update.auth) {

            if (request.pre.cookie || request.pre.basic) {

              return request.pre.cookie || request.pre.basic;
            }
          }

          return Boom.notFound('Authorization Denied');
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

          return h.continue;
        }
      }, {
        assign: 'basic',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.get.auth) {

            console.log('basic');

            return await server.auth.test('simple',request);
          }

          return h.continue;
        }
      },  {

        assign: 'cookie',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.get.auth) {

            console.log( await server.auth.test('session',request));
          }

          return h.continue;
        }
      }, {
        assign: 'credentials',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.get.auth) {
            if (request.pre.cookie || request.pre.basic) {

              return request.pre.cookie || request.pre.basic;
            }

            throw Boom.notFound('Authorization denied');
          }

          else {
            return h.continue;
          }

        }
      }]

    },
    handler: async function (request,h) {

      return await request.pre.model.routes.get.handler(request,h);
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



