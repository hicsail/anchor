'use strict';
const internals = {};

internals.applyRoutes = function (server, next) {

    server.route({
        method: 'GET',
        path: '/signup',
        config: {
            auth: {
                mode: 'try',
                strategy: 'session'
            },
            plugins: {
                'hapi-auth-cookie': {
                    redirectTo: false
                }
            }
        },
        handler: function (request, reply) {

            if (request.auth.isAuthenticated) {
                return reply.redirect('/');
            }
            return reply.view('signup/signup');
        }
    });

    next();
};

exports.register = function (server, options, next) {

    server.dependency(['auth'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'signup/index',
    dependencies: 'visionary'
};
