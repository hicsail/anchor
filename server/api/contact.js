'use strict';
const Config = require('../../config');
const Joi = require('joi');
const PermissionConfigTable = require('../../permission-config');
const DEFAULT_ROLES = require('../helper/getDefaultRoles');

const internals = {};


internals.applyRoutes = function (server, next) {

  server.route({//TODO: this route didn't have any strategies or auth before
    method: 'POST',
    path: '/contact',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: PermissionConfigTable.POST['/api/contact'] || DEFAULT_ROLES
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          message: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      const mailer = request.server.plugins.mailer;
      const emailOptions = {
        subject: Config.get('/projectName') + ' contact form',
        to: Config.get('/system/toAddress'),
        replyTo: {
          name: request.payload.name,
          address: request.payload.email
        }
      };
      const template = 'contact';

      mailer.sendEmail(emailOptions, template, request.payload, (err, info) => {

        if (err) {
          return reply(err);
        }

        reply({ message: 'Success.' });
      });
    }
  });


  next();
};


exports.register = function (server, options, next) {

  server.dependency('mailer', internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'contact'
};
