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

          if (model.routes.create.auth) {
            if (!request.auth.isAuthenticated) {

              throw Boom.notFound('Authentication Required');
            }

            return h.continue;


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
            return Boom.notFound('Permission Denied: Route Disabled');
          }

          return h.continue;
        }
      },  {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.getId.auth) {



            if (!request.auth.isAuthenticated) {
              throw Boom.notFound('Authorization denied');

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
            return Boom.notFound('Permission Denied: Route Disabled');
          }
          return h.continue;
        }
      }, {

        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.delete.auth) {
            if (!request.auth.isAuthenticated) {

              throw Boom.notFound('Authorization Denied');
            }


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

          if (model.routes.update.auth) {

            if (!request.auth.isAuthenticated) {

              return Boom.notFound('Authorization Denied');
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

          if (model.routes.get.disabled) {
            return (Boom.notFound('Permission Denied: Route Disabled'));
          }

          return h.continue;
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.get.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.notFound('Authorization Denied');

            }

            return h.continue;

          }

          return h.continue;

        }
      }]

    },
    handler: async function (request,h) {

      return await request.pre.model.routes.get.handler(request,h);
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
