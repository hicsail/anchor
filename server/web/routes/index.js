'use strict';


exports.register = function (server, options, next) {

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {

            return reply.view('index/index');
        }
    });


    next();
};


exports.register.attributes = {
    name: 'home',
    dependencies: 'visionary'
};
