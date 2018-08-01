'use strict';
const Boom = require('boom');
const Joi = require('joi');

const register = function (server,serverOptions) {



  server.route({
    method: 'POST',
    path:'/api/{collectionName}',
    config: {
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
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.create.basicAuth || model.routes.create.cookieAuth) {
            return true;
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
        assign: 'basic',
        method: async function (request,h) {

          const model = request.pre.model;
          if (model.routes.create.basicAuth) {

            return await server.auth.test('simple',request);
          }

          return h.continue;
        }
      },
      {
        assign: 'cookie',
        method:  async function (request,h) {

          const model = request.pre.model;
          if (model.routes.create.cookieAuth) {
            return await server.auth.test('session',request);
          }

          return h.continue;
        }
      },
      {
        assign: 'credentials',
        method: function (request,h) {

          if (request.pre.auth) {

            if (request.pre.basic || request.pre.cookie) {
              return request.pre.basic || request.pre.cookie;
            }

            throw Boom.notFound('Authorization Denied');
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

        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.getId.basicAuth || model.routes.getId.cookieAuth) {

            return true;
          }

          return h.continue;
        }
      }, {
        assign: 'basic',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.getId.basicAuth) {
            return await server.auth.test('simple',request);
          }

          h.continue;

        }
      }, {
        assign: 'cookie',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.getId.cookieAuth) {
            return await server.auth.test('session',request);
          }
          return h.continue;
        }
      }, {
        assign: 'credentials',
        method: async function (request,h) {

          if (request.pre.auth) {



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
    method: 'GET',
    path: '/api/{collectionName}/routes',
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
      }]
    },
    handler: async function (request,h) {

      return await JSONStringify(request.pre.model.routes);

    }
  });


  server.route({
    method: 'GET',
    path: '/api/{collectionName}/schema',
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
      }]
    },
    handler: async function (request,h) {

      return await JSONStringify(request.pre.model.schema);

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

        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.delete.basicAuth || model.routes.delete.cookieAuth) {

            return true;
          }
          return h.continue;
        }

      }, {
        assign: 'basic',
        method: async function (request,h) {

          const model = request.pre.model;
          if (model.routes.delete.basicAuth) {

            return await server.auth.test('simple',request);
          }

          return h.continue;
        }
      }, {
        assign: 'cookie',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.delete.cookieAuth) {

            return await server.auth.test('session',request);
          }

          return h.continue;
        }
      }, {

        assign: 'credentials',
        method: function (request,h) {

          if (request.pre.auth) {
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
      }, {

        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.update.cookieAuth || model.routes.update.basicAuth) {

            return true;
          }
          return h.continue;
        }
      },
      {
        assign: 'basic',
        method: async function (request,h) {

          const model = request.pre.model;
          if (model.routes.update.basicAuth) {

            return await server.auth.test('simple',request);
          }

          return h.continue;
        }
      }, {
        assign: 'cookie',
        method: async function (request,h) {

          const model = request.pre.model;
          if (model.routes.update.cookieAuth) {

            return await server.auth.test('cookie',request);
          }

          return h.continue;
        }



      }, {

        assign: 'credentials',
        method: function (request,h) {

          if (request.pre.cookie || request.pre.basic) {

            return request.pre.cookie || request.pre.basic;
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
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.get.cookieAuth || model.routes.get.basicAuth) {

            return true;
          }

          return h.continue;
        }
      }, {
        assign: 'basic',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.get.basicAuth) {

            return await server.auth.test('simple',request);
          }

          return h.continue;
        }
      },  {

        assign: 'cookie',
        method: async function (request,h) {

          const model = request.pre.model;

          if (model.routes.get.cookieAuth) {

            return await server.auth.test('session',request);
          }

          return h.continue;
        }
      }, {
        assign: 'credentials',
        method: function (request,h) {

          if (request.pre.auth) {
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

      return await request.pre.model.routes.getAll.handler(request,h);
    }
  });

  const JSONStringify = (object) => {

    let cache = [];
    const str = JSON.stringify(object,
      // custom replacer fxn - gets around "TypeError: Converting circular structure to JSON"
      (key, value) => {

        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }, 4);
    cache = null; // enable garbage collection
    return str;
  };
};



module.exports = {
  name: 'anchor-api',
  dependencies: [
    'auth',
    'hapi-anchor-model'
  ],
  register
};
