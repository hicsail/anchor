'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../../config');
const internals = {};


internals.applyRoutes = function (server, next) {

    const Session = server.plugins['hapi-mongo-models'].Session;
    const User = server.plugins['hapi-mongo-models'].User;


    server.route({
        method: 'POST',
        path: '/signup',
        config: {
            auth: {
                mode: 'try',
                strategy: 'session'
            },
            validate: {
                payload: User.payload
            },
            plugins: {
                'hapi-auth-cookie': {
                    redirectTo: false
                }
            },
            pre: [{
                assign: 'usernameCheck',
                method: function (request, reply) {

                    const conditions = {
                        username: request.payload.username
                    };

                    User.findOne(conditions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (user) {
                            return reply(Boom.conflict('Username already in use.'));
                        }

                        reply(true);
                    });
                }
            }, {
                assign: 'emailCheck',
                method: function (request, reply) {

                    const conditions = {
                        email: request.payload.email
                    };

                    User.findOne(conditions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (user) {
                            return reply(Boom.conflict('Email already in use.'));
                        }

                        reply(true);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const mailer = request.server.plugins.mailer;

            Async.auto({
                user: function (done) {

                    const username = request.payload.username;
                    const password = request.payload.password;
                    const email = request.payload.email;
                    const name = request.payload.name;
                    const gender = request.payload.gender;
                    const phone = request.payload.phone;
                    const address = request.payload.address;
                    const dob = request.payload.dob;
                    const height = request.payload.height;
                    const weight = request.payload.weight;

                    User.create(username, password, email, name, gender, dob, height, weight, phone, address, done);
                },
                welcome: ['user', function (results, done) {

                    const emailOptions = {
                        subject: 'Your ' + Config.get('/projectName') + ' account',
                        to: {
                            name: request.payload.name,
                            address: request.payload.email
                        }
                    };
                    const template = 'welcome';

                    mailer.sendEmail(emailOptions, template, request.payload, (err) => {

                        if (err) {
                            console.warn('sending welcome email failed:', err.stack);
                        }
                    });

                    done();
                }],
                session: ['user', function (results, done) {

                    Session.create(results.user._id.toString(), done);
                }]
            }, (err, results) => {

                if (err) {
                    return reply(err);
                }

                const user = results.user;
                const credentials = results.session._id + ':' + results.session.key;
                const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

                request.cookieAuth.set(results.session);
                reply({
                    user: {
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                        roles: user.roles
                    },
                    session: results.session,
                    authHeader
                });
            });
        }
    });


    next();
};


exports.register = function (server, options, next) {

    server.dependency(['auth', 'mailer', 'hapi-mongo-models'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'signup'
};
