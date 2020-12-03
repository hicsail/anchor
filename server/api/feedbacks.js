'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Feedback = require('../models/feedback');
const PermissionConfigTable = require('../permission-config.json');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/api/feedback/unresolved',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: PermissionConfigTable.GET['/api/feedback/unresolved'] || ['root']
      }
    },
    handler: async function (request, h) {

      const total = await Feedback.count({ resolved: false });

      return total;
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/feedback/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: PermissionConfigTable.PUT['/api/feedback/{id}'] || ['root']
      },
      validate: {
        payload: {
          resolved: Joi.boolean().required(),
          comment: Joi.string().required()
        }
      }
    },
    handler: async function (request, h) {

      const id = request.params.id;
      const update = {
        $set: {
          resolved: request.payload.resolved,
          comment: request.payload.comment
        }
      };

      const feedback = await Feedback.findByIdAndUpdate(id, update);

      if (!feedback) {
        throw Boom.notFound('feedback not found.');
      }

      return feedback;
    }
  });
};

module.exports = {
  name: 'feedbacks',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
