'use strict';
const Boom = require('boom');
const Clinician = require('../models/clinician');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

    const User = server.plugins['hapi-mongo-models'].User;

    server.route({
        method: 'GET',
        path: '/users',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: 'admin'
            },
            validate: {
                query: {
                    username: Joi.string().token().lowercase(),
                    isActive: Joi.string(),
                    role: Joi.string(),
                    fields: Joi.string(),
                    sort: Joi.string().default('_id'),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            }
        },
        handler: function (request, reply) {

            const query = {};
            if (request.query.username) {
                query.username = new RegExp('^.*?' + request.query.username + '.*$', 'i');
            }
            if (request.query.isActive) {
                query.isActive = request.query.isActive === 'true';
            }
            if (request.query.role) {
                query['roles.' + request.query.role] = { $exists: true };
            }
            const fields = request.query.fields;
            const sort = request.query.sort;
            const limit = request.query.limit;
            const page = request.query.page;

            User.pagedFind(query, fields, sort, limit, page, (err, results) => {

                if (err) {
                    return reply(err);
                }

                reply(results);
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/users/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: 'admin'
            }
        },
        handler: function (request, reply) {

            User.findById(request.params.id, (err, user) => {

                if (err) {
                    return reply(err);
                }

                if (!user) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(user);
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/users/my',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['admin', 'account']
            }
        },
        handler: function (request, reply) {

            const id = request.auth.credentials.user._id.toString();
            const fields = User.fieldsAdapter('username email roles');

            User.findById(id, fields, (err, user) => {

                if (err) {
                    return reply(err);
                }

                if (!user) {
                    return reply(Boom.notFound('Document not found. That is strange.'));
                }

                reply(user);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/users',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: 'admin'
            },
            validate: {
                payload: User.payload
            },
            pre: [
                {
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
                }
            ]
        },
        handler: function (request, reply) {

            const username = request.payload.username;
            const password = request.payload.password;
            const email = request.payload.email;

            User.create(username, password, email, (err, user) => {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/users/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: 'admin'
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                },
                payload: {
                    isActive: Joi.boolean().required(),
                    username: Joi.string().token().lowercase().required(),
                    email: Joi.string().email().lowercase().required()
                }
            },
            pre: [
                {
                    assign: 'usernameCheck',
                    method: function (request, reply) {

                        const conditions = {
                            username: request.payload.username,
                            _id: { $ne: User._idClass(request.params.id) }
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
                            email: request.payload.email,
                            _id: { $ne: User._idClass(request.params.id) }
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
                }
            ]
        },
        handler: function (request, reply) {

            const id = request.params.id;
            const update = {
                $set: {
                    isActive: request.payload.isActive,
                    username: request.payload.username,
                    email: request.payload.email
                }
            };

            User.findByIdAndUpdate(id, update, (err, user) => {

                if (err) {
                    return reply(err);
                }

                if (!user) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(user);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/users/my',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['admin', 'account']
            },
            validate: {
                payload: {
                    username: Joi.string().token().lowercase().required(),
                    email: Joi.string().email().lowercase().required(),
                    name: Joi.string().required(),
                    gender: Joi.string().allow('male','female'),
                    dob: Joi.date(),
                    address: Joi.string().allow('').optional(),
                    phone: Joi.string().allow('').optional(),
                    height: Joi.number().optional(),
                    weight: Joi.number().optional()
                }
            },
            pre: [
                {
                    assign: 'usernameCheck',
                    method: function (request, reply) {

                        const conditions = {
                            username: request.payload.username,
                            _id: { $ne: request.auth.credentials.user._id }
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
                            email: request.payload.email,
                            _id: { $ne: request.auth.credentials.user._id }
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
                }
            ]
        },
        handler: function (request, reply) {

            const id = request.auth.credentials.user._id.toString();
            const update = {
                $set: {
                    username: request.payload.username,
                    email: request.payload.email,
                    name: request.payload.name,
                    gender: request.payload.gender,
                    dob: request.payload.dob,
                    address: request.payload.address,
                    phone: request.payload.phone,
                    height: request.payload.height,
                    weight: request.payload.weight
                }
            };
            const findOptions = {
                fields: User.fieldsAdapter('username email roles gender dob address phone height weight')
            };

            User.findByIdAndUpdate(id, update, findOptions, (err, user) => {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/users/{id}/password',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: 'admin'
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                },
                payload: {
                    password: Joi.string().required()
                }
            },
            pre: [
                {
                    assign: 'password',
                    method: function (request, reply) {

                        User.generatePasswordHash(request.payload.password, (err, hash) => {

                            if (err) {
                                return reply(err);
                            }

                            reply(hash);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            const id = request.params.id;
            const update = {
                $set: {
                    password: request.pre.password.hash
                }
            };

            User.findByIdAndUpdate(id, update, (err, user) => {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/users/my/password',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['admin', 'account']
            },
            validate: {
                payload: {
                    password: Joi.string().required()
                }
            },
            pre: [{
                assign: 'password',
                method: function (request, reply) {

                    User.generatePasswordHash(request.payload.password, (err, hash) => {

                        if (err) {
                            return reply(err);
                        }

                        reply(hash);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const id = request.auth.credentials.user._id.toString();
            const update = {
                $set: {
                    password: request.pre.password.hash
                }
            };

            User.findByIdAndUpdate(id, update, (err, user) => {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    server.route({
        method: 'DELETE',
        path: '/users/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: 'admin'
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                }
            }
        },
        handler: function (request, reply) {

            User.findByIdAndDelete(request.params.id, (err, user) => {

                if (err) {
                    return reply(err);
                }

                if (!user) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply({ message: 'Success.' });
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/users/clinician/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['root','admin','researcher']
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                }
            },
            pre: [{
                assign: 'notYou',
                method: function (request, reply) {

                    if (request.auth.credentials.user._id === request.params.id) {
                        return reply(Boom.conflict('Unable to promote yourself'));
                    }

                    reply(true);
                }
            },{
                assign: 'user',
                method: function (request, reply) {

                    const findOptions = {
                        fields: User.fieldsAdapter('username roles')
                    };

                    User.findById(request.params.id, findOptions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User not found to promote'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const user = request.pre.user;

            if (user.roles.clinician) {
                return reply(user);
            }

            user.roles.clinician = new Clinician([]);
            const update = {
                $set: {
                    roles: user.roles
                }
            };

            User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

                if (err) {
                    return reply(err);
                }

                reply({
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    roles: updatedUser.roles
                });
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/users/clinician/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['root','admin','researcher']
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                }
            },
            pre: [{
                assign: 'notYou',
                method: function (request, reply) {

                    if (request.auth.credentials.user._id.toString() === request.params.id) {
                        return reply(Boom.conflict('Unable to demote yourself'));
                    }
                    reply(true);
                }
            },{
                assign: 'user',
                method: function (request, reply) {

                    const findOptions = {
                        fields: User.fieldsAdapter('username roles')
                    };

                    User.findById(request.params.id, findOptions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User not found to promote'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const user = request.pre.user;

            if (!user.roles.clinician) {
                return reply(user);
            }

            delete user.roles.clinician;
            const update = {
                $set: {
                    roles: user.roles
                }
            };

            User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

                if (err) {
                    return reply(err);
                }

                reply({
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    roles: updatedUser.roles
                });
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/users/analyst/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['root','admin','researcher']
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                }
            },
            pre: [{
                assign: 'notYou',
                method: function (request, reply) {

                    if (request.auth.credentials.user._id === request.params.id) {
                        return reply(Boom.conflict('Unable to promote yourself'));
                    }

                    reply(true);
                }
            },{
                assign: 'user',
                method: function (request, reply) {

                    const findOptions = {
                        fields: User.fieldsAdapter('username roles')
                    };

                    User.findById(request.params.id, findOptions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User not found to promote'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const user = request.pre.user;

            if (user.roles.analyst) {
                return reply(user);
            }

            user.roles.analyst = true;
            const update = {
                $set: {
                    roles: user.roles
                }
            };

            User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

                if (err) {
                    return reply(err);
                }

                reply({
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    roles: updatedUser.roles
                });
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/users/analyst/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['root','admin','researcher']
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                }
            },
            pre: [{
                assign: 'notYou',
                method: function (request, reply) {

                    if (request.auth.credentials.user._id.toString() === request.params.id) {
                        return reply(Boom.conflict('Unable to demote yourself'));
                    }
                    reply(true);
                }
            },{
                assign: 'user',
                method: function (request, reply) {

                    const findOptions = {
                        fields: User.fieldsAdapter('username roles')
                    };

                    User.findById(request.params.id, findOptions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User not found to promote'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const user = request.pre.user;

            if (!user.roles.analyst) {
                return reply(user);
            }

            delete user.roles.analyst;
            const update = {
                $set: {
                    roles: user.roles
                }
            };

            User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

                if (err) {
                    return reply(err);
                }

                reply({
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    roles: updatedUser.roles
                });
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/users/researcher/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['root','admin']
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                }
            },
            pre: [{
                assign: 'notYou',
                method: function (request, reply) {

                    if (request.auth.credentials.user._id === request.params.id) {
                        return reply(Boom.conflict('Unable to promote yourself'));
                    }

                    reply(true);
                }
            },{
                assign: 'user',
                method: function (request, reply) {

                    const findOptions = {
                        fields: User.fieldsAdapter('username roles')
                    };

                    User.findById(request.params.id, findOptions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User not found to promote'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const user = request.pre.user;

            if (user.roles.researcher) {
                return reply(user);
            }

            user.roles.researcher = true;
            const update = {
                $set: {
                    roles: user.roles
                }
            };

            User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

                if (err) {
                    return reply(err);
                }

                reply({
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    roles: updatedUser.roles
                });
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/users/researcher/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['root','admin']
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                }
            },
            pre: [{
                assign: 'notYou',
                method: function (request, reply) {

                    if (request.auth.credentials.user._id.toString() === request.params.id) {
                        return reply(Boom.conflict('Unable to demote yourself'));
                    }
                    reply(true);
                }
            },{
                assign: 'user',
                method: function (request, reply) {

                    const findOptions = {
                        fields: User.fieldsAdapter('username roles')
                    };

                    User.findById(request.params.id, findOptions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User not found to promote'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const user = request.pre.user;

            if (!user.roles.researcher) {
                return reply(user);
            }

            delete user.roles.researcher;
            const update = {
                $set: {
                    roles: user.roles
                }
            };

            User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

                if (err) {
                    return reply(err);
                }

                reply({
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    roles: updatedUser.roles
                });
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/users/admin/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['root']
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                }
            },
            pre: [{
                assign: 'notYou',
                method: function (request, reply) {

                    if (request.auth.credentials.user._id === request.params.id) {
                        return reply(Boom.conflict('Unable to promote yourself'));
                    }

                    reply(true);
                }
            },{
                assign: 'user',
                method: function (request, reply) {

                    const findOptions = {
                        fields: User.fieldsAdapter('username roles')
                    };

                    User.findById(request.params.id, findOptions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User not found to promote'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const user = request.pre.user;

            if (user.roles.admin) {
                return reply(user);
            }

            user.roles.admin = true;
            const update = {
                $set: {
                    roles: user.roles
                }
            };

            User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

                if (err) {
                    return reply(err);
                }

                reply({
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    roles: updatedUser.roles
                });
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/users/admin/{id}',
        config: {
            auth: {
                strategies: ['simple','session'],
                scope: ['root']
            },
            validate: {
                params: {
                    id: Joi.string().invalid('000000000000000000000000')
                }
            },
            pre: [{
                assign: 'notYou',
                method: function (request, reply) {

                    if (request.auth.credentials.user._id.toString() === request.params.id) {
                        return reply(Boom.conflict('Unable to demote yourself'));
                    }
                    reply(true);
                }
            },{
                assign: 'user',
                method: function (request, reply) {

                    const findOptions = {
                        fields: User.fieldsAdapter('username roles')
                    };

                    User.findById(request.params.id, findOptions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (!user) {
                            return reply(Boom.notFound('User not found to promote'));
                        }

                        reply(user);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const user = request.pre.user;

            if (!user.roles.admin) {
                return reply(user);
            }

            delete user.roles.admin;
            const update = {
                $set: {
                    roles: user.roles
                }
            };

            User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

                if (err) {
                    return reply(err);
                }

                reply({
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    roles: updatedUser.roles
                });
            });
        }
    });


    next();
};


exports.register = function (server, options, next) {

    server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'users'
};
