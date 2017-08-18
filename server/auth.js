'use strict';
const Async = require('async');
const Config = require('../config');


const internals = {};


internals.applyStrategy = function (server, next) {

    const Session = server.plugins['hapi-mongo-models'].Session;
    const User = server.plugins['hapi-mongo-models'].User;

    server.auth.strategy('simple', 'basic', {
        validateFunc: function (request, username, password, callback) {

            Async.auto({
                session: function (done) {

                    Session.findByCredentials(username, password, done);
                },
                user: ['session', function (results, done) {

                    if (!results.session) {
                        return done();
                    }

                    User.findById(results.session.userId, done);
                }],
                scope: ['user', function (results, done) {

                    if (!results.user || !results.user.roles) {
                        return done();
                    }

                    done(null, Object.keys(results.user.roles));
                }]
            }, (err, results) => {

                if (err) {
                    return callback(err);
                }

                if (!results.session) {
                    return callback(null, false);
                }

                callback(null, Boolean(results.user), results);
            });
        }
    });


    server.auth.strategy('session', 'cookie', {
        password: Config.get('/cookieSecret'),
        cookie: 'AuthCookie',
        isSecure: false,
        clearInvalid: true,
        redirectTo: '/login',
        appendNext: 'returnUrl',
        validateFunc: function (request, data, callback) {

            Async.auto({
                session: function (done) {

                    const id = data._id;
                    const key = data.key;

                    Session.findByCredentials(id, key, done);
                },
                user: ['session', function (results, done) {

                    if (!results.session) {
                        return done();
                    }

                    User.findById(results.session.userId, done);
                }],
                scope: ['user', function (results, done) {

                    if (!results.user || !results.user.roles) {
                        return done();
                    }

                    done(null, Object.keys(results.user.roles));
                }]
            }, (err, results) => {

                if (err) {
                    return callback(err);
                }

                if (!results.session) {
                    return callback(null, false);
                }

                callback(null, Boolean(results.user), results);
            });
        }
    });


    next();
};

exports.register = function (server, options, next) {

    server.dependency('hapi-mongo-models', internals.applyStrategy);

    next();
};


exports.preware = internals.preware;


exports.register.attributes = {
    name: 'auth'
};
