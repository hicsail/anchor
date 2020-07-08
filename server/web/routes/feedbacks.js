'use strict';
const internals = {};
const Async = require('async');
const Config = require('../../../config');
const Feedback = require('../../models/feedback');
const User = require('../../models/user');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/feedback',
    options : {
      auth: {
        strategies: ['session'],
        mode: 'try'
      }
    },    
    handler: async function (request, h) {

      return h.view('feedback/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Feedback',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/feedback/{id}',
    options : {
      auth: {
        strategies: ['session'],
        scope: ['root','admin'],
        mode: 'try'
      }
    },    
    handler: async function (request, h) {

      const feedback = await Feedback.findById(request.params.id);

      if (!feedback) {

        throw Boom.notFound('feedback not found.');      
      }

      const user = await User.findById(feedback.userId);

      return h.view('feedback/edit', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Feedback',
        baseUrl: Config.get('/baseUrl'),
        feedback: feedback,
        feedbackUser: user
      });      
    }
  });
  
};

module.exports = {
  name: 'feedbackList',
  dependencies: [
    'hapi-anchor-model',
    'auth'       
  ],
  register
};