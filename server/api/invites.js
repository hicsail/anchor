'use strict';
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');
const Invite = require('../models/invite');
const User = require('../models/user');
const Mailer = require('../mailer');

const register  = function (server, options) {

  server.route({
    method: 'POST',
    path: '/api/invite',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: Invite.payload
      }
    },
    handler: async function (request, h) {

      const invite = await Invite.create(request.payload.name,request.payload.email,request.payload.description, request.auth.credentials.user._id.toString());
      
      const emailOptions = {
        subject: 'You have been invited to ' + Config.get('/projectName'),
        to: {
          name: request.payload.name,
          address: request.payload.email
        }
      };
      const template = 'invite';
      const context = {
        url: request.headers.origin + '/invite/' + invite._id.toString(),
        name: Config.get('/projectName')
      };

      try {
        await Mailer.sendEmail(emailOptions, template, context);
      }
      catch (err) {
        request.log(['mailer', 'error'], err);
      }       
      
      return invite;     
    }
  });  

  server.route({
    method: 'PUT',
    path: '/api/invite/{id}/reject',
    handler: async function (request, h) {

      const id = request.params.id;
      const update = {
        $set: {
          status: 'Reject'
        }
      };

      const invite = Invite.findByIdAndUpdate(id, update);

      if (!invite) {
        throw Boom.notFound('Document not found.');
      }

      return invite;      
    }
  });  
};

module.exports = {
  name: 'invites',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};