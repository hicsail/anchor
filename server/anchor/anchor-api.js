'use strict';
const Boom = require('boom');
const Joi = require('joi');

const register = function (server,serverOptions) {



  server.route({
    method: 'POST',
    path:'/api/{collectionName}',
    options: {
      auth: {
        strategies: ['simple','session','token'],
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
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'payload',
        method: function (request,h) {

          const model = request.pre.model;
          const { error } = Joi.validate(request.payload,model.routes.create.payload);

          if (error) {
            throw Boom.badRequest('Incorrect Payload', error);
          }
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
      }
      ]
    },
    handler: async function (request,h) {

      return await request.pre.model.routes.create.handler(request,h);
    }
  });

  server.route({
    method: 'POST',
    path: '/api/{collectionName}/insertMany',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      },
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];
          if (!model) {
            throw Boom.notFound('Model not found');
          }
          return model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.insertMany.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'validate',
        method: function (request,h) {

          const model = request.pre.model;
          const { error } = (Joi.validate(request.payload,Joi.array().items(model.routes.insertMany.payload)));

          if (error) {
            throw Boom.badRequest('Incorrect Payload', error);
          }
          return h.continue;
        }
      }, {

        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.insertMany.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
          }
          return h.continue;
        }
      }]
    },
    handler: async function (request,h) {

      return await request.pre.model.routes.insertMany.handler(request,h);
    }

  });

  server.route({
    method: 'GET',
    path: '/api/{collectionName}/{id}',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      },
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
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      },  {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.getId.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
            return h.continue;
          }
          return h.continue;
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
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode:'try'
      },
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
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {

        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.delete.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
            return h.continue;
          }
          return h.continue;
        }
      }]
    },
    handler: async function (request,h) {

      return await request.pre.model.routes.delete.handler(request,h);
    }
  });

  server.route({
    method:'GET',
    path: '/api/{collectionName}/my',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode:'try'
      },
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
        method: function (request, h) {

          const model = request.pre.model;
          if (model.routes.getMy.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'validate',
        method: function (request,h) {

          const model = request.pre.model;

          if (!Joi.validate(request.query,model.routes.getMy.query)) {
            throw Boom.notFound('Query not validated');
          }
          return h.continue;
        }
      },  {
        assign: 'auth',
        method: function (request, h) {

          const model = request.pre.model;
          if (model.routes.getMy.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
            return h.continue;
          }
          return h.continue;
        }
      }]
    },

    handler: async function (request,h) {

      return await request.pre.model.routes.getMy.handler(request,h);

    }
  });

  server.route({
    method:'PUT',
    path: '/api/{collectionName}/{id}',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode:'try'
      },
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
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'payload',
        method: function (request,h) {

          const model = request.pre.model;
          const { error } = Joi.validate(request.payload,model.routes.update.payload);

          if (error) {
            throw Boom.badRequest('Incorrect Payload', error);
          }
          return h.continue;
        }
      }, {

        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.update.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
            return h.continue;
          }
          return h.continue;
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
    options: {
      validate: {
        query: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      },
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
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
          if (model.routes.getAll.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'validate',
        method: function (request,h) {

          const model = request.pre.model;

          if (!Joi.validate(request.query,model.routes.getAll.query)) {
            throw Boom.notFound('Query not validated');
          }
          return h.continue;
        }


      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.getAll.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
            return h.continue;
          }
          return h.continue;
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
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'auth',
    'hapi-anchor-model'
  ],
  register
};
