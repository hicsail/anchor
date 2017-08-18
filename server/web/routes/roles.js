'use strict';
const internals = {};

internals.applyRoutes = function (server, next) {

    server.route({
        method: 'GET',
        path: '/roles',
        config: {
            auth: {
                strategy: 'session',
                scope: ['root', 'admin', 'researcher']
            }
        },
        handler: function (request, reply) {

            return reply.view('roles/index', { user: request.auth.credentials.user });
        }
    });

    next();
};


exports.register = function (server, options, next) {

    server.dependency(['auth'], internals.applyRoutes);

    next();
};

exports.register.attributes = {
    name: 'roles',
    dependencies: 'visionary'
};
