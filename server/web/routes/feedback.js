'use strict';
const internals = {};
const Async = require('async');
const Config = require('../../../config');
const Feedback = require('../../models/feedback');
const User = require('../../models/user');

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/feedback',
    config: {
      auth: {
        strategy: 'session'
      }
    },
    handler: function (request, reply) {

      return reply.view('feedback/index', {
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
    config: {
      auth: {
        strategy: 'session',
        scope: ['root','admin']
      }
    },
    handler: function (request, reply) {

      Async.auto({
        feedback: function (done) {

          Feedback.findById(request.params.id,done);
        },
        user: ['feedback', function (results,done) {

          User.findById(results.feedback.userId,done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        return reply.view('feedback/edit', {
          user: request.auth.credentials.user,
          projectName: Config.get('/projectName'),
          title: 'Feedback',
          baseUrl: Config.get('/baseUrl'),
          feedback: results.feedback,
          feedbackUser: results.user
        });
      });
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'feedbackList',
  dependencies: 'visionary'
};
