'use strict';
const Config = require('../../../config');
const Event = require('../../models/event');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/events',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      const names = await Event.distinct('name');

      return h.view('events/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Events',
        baseUrl: Config.get('/baseUrl'),
        events: names
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/events/name/{name}',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      const names = await Event.distinct('name');

      const fields = Event.fieldsAdapter('time');
      const events = await Event.find({ name: request.params.name },fields);

      events.sort((a, b) => {

        return parseFloat(a.time.getTime()) - parseFloat(b.time.getTime());
      });

      return h.view('events/eventView', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Feedback',
        baseUrl: Config.get('/baseUrl'),
        eventName: request.params.name,
        eventData: events,
        events: names
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/events/user/{userId}',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      const names = await Event.distinct('name');

      const fields = Event.fieldsAdapter('name time');
      const events = await Event.find({ userId: request.params.userId },fields);

      events.sort((a, b) => {

        return parseFloat(a.time.getTime()) - parseFloat(b.time.getTime());
      });

      return h.view('events/eventUser', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Feedback',
        baseUrl: Config.get('/baseUrl'),
        eventData: events,
        events: names
      });
    }
  });
};

module.exports = {
  name: 'eventsList',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
