'use strict';
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');
const Invite = require('../models/invite');
const User = require('../models/user');
const Mailer = require('../mailer');

const register  = function (server, options) {  

  server.route({
    method: 'GET',
    path: '/api/table/invite',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: async function (request, h) {

      const accessLevel = User.highestRole(request.auth.credentials.user.roles);
      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      let fields = request.query.fields;

      const query = {};
      //no role
      if (accessLevel === 0) {
        query.userId = request.auth.credentials.user._id.toString();
      }
      //analyst
      else if (accessLevel === 1) {
        if (fields) {
          fields = fields.split(' ');
          let length = fields.length;
          for (let i = 0; i < length; ++i) {
            if (User.PHI().concat(['key']).indexOf(fields[i]) !== -1) {

              fields.splice(i, 1);
              i--;
              length--;
            }
          }
          fields = fields.join(' ');
        }
      }
      //clinician
      else if (accessLevel === 2) {
        query.userId = request.auth.credentials.user._id.toString();
      }

      let userFields = 'studyID username';
      if (accessLevel === 1) {
        //if analyst remove PHI
        userFields = userFields.split(' ');
        let length = userFields.length;
        for (let i = 0; i < length; ++i) {
          if (User.PHI().indexOf(userFields[i]) !== -1) {

            userFields.splice(i, 1);
            i--;
            length--;
          }
        }
        userFields = userFields.join(' ');
      }
      userFields = User.fieldsAdapter(userFields);

      const lookups = [{
        from: User,
        local: 'userId',
        foreign: '_id',
        as: 'user',
        one: false                
      }];          

      const invites = await Invite.pagedLookup(query,page,limit,lookups);

      return {
        draw: request.query.draw,
        recordsTotal: invites.data.length,
        recordsFiltered: invites.items.total,
        data: invites.data          
      };      
    }
  });

  server.route({
    method: 'GET',
    path: '/api/invite',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin', 'researcher']
      },
      validate: {
        query: {
          fields: Joi.string(),
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      }
    },
    handler: async function (request, h) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      const invites = await Feedback.pagedFind(query, page, limit);

      return invites;      
    }
  });

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
    path: '/api/invite/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      },
      validate: {
        payload: Invite.payload
      }
    },
    handler: async function (request, h) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          email: request.payload.email,
          description: request.payload.description
        }
      };

      const invite = Invite.findByIdAndUpdate(id, update);

      if (!invite) {
        throw Boom.notFound('Document not found.');
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

  server.route({
    method: 'GET',
    path: '/api/invite/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: async function (request, h) {

      const invite = await Invite.findById(request.params.id);

      if (!invite) {
        throw Boom.notFound('Document not found.');
      }

      return invite;      
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/invite/{id}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      }
    },
    handler: async function (request, h) {

      const invite = Invite.findByIdAndDelete(request.params.id);

      if (!invite) {
        throw Boom.notFound('Document not found.');
      }

      return { message: 'Success.' };      
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