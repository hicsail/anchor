'use strict';
const Async = require('async');
const Bcrypt = require('bcrypt');
const Clinician = require('./clinician');
const Joi = require('joi');
const MongoModels = require('mongo-models');


class User extends MongoModels {
    static generatePasswordHash(password, callback) {

        Async.auto({
            salt: function (done) {

                Bcrypt.genSalt(10, done);
            },
            hash: ['salt', function (results, done) {

                Bcrypt.hash(password, results.salt, done);
            }]
        }, (err, results) => {

            if (err) {
                return callback(err);
            }

            callback(null, {
                password,
                hash: results.hash
            });
        });
    }

    static create(username, password, email, name, gender, dob, height, weight, phone, address, callback) {

        const self = this;

        Async.auto({
            passwordHash: this.generatePasswordHash.bind(this, password),
            newUser: ['passwordHash', function (results, done) {

                const document = {
                    isActive: true,
                    isInStudy: true,
                    username: username.toLowerCase(),
                    password: results.passwordHash.hash,
                    email: email.toLowerCase(),
                    name,
                    gender,
                    dob,
                    height,
                    weight,
                    phone,
                    address,
                    roles: {},
                    timeCreated: new Date()
                };

                self.insertOne(document, done);
            }]
        }, (err, results) => {

            if (err) {
                return callback(err);
            }

            results.newUser[0].password = results.passwordHash.password;

            callback(null, results.newUser[0]);
        });
    }

    static findByCredentials(username, password, callback) {

        const self = this;

        Async.auto({
            user: function (done) {

                const query = {
                    isActive: true
                };

                if (username.indexOf('@') > -1) {
                    query.email = username.toLowerCase();
                }
                else {
                    query.username = username.toLowerCase();
                }

                self.findOne(query, done);
            },
            passwordMatch: ['user', function (results, done) {

                if (!results.user) {
                    return done(null, false);
                }

                const source = results.user.password;
                Bcrypt.compare(password, source, done);
            }]
        }, (err, results) => {

            if (err) {
                return callback(err);
            }

            if (results.passwordMatch) {
                return callback(null, results.user);
            }

            callback();
        });
    }

    static findByUsername(username, callback) {

        const query = { username: username.toLowerCase() };

        this.findOne(query, callback);
    }

    constructor(attrs) {

        super(attrs);

        Object.defineProperty(this, '_roles', {
            writable: true,
            enumerable: false
        });
    }
}


User.collection = 'users';


User.schema = Joi.object().keys({
    _id: Joi.object(),
    isActive: Joi.boolean().default(true),
    username: Joi.string().token().lowercase().required(),
    password: Joi.string(),
    name: Joi.string(),
    gender: Joi.string().allow('male','female'),
    dob: Joi.date(),
    address: Joi.string(),
    phone: Joi.string(),
    isInStudy: Joi.boolean().default(true),
    email: Joi.string().email().lowercase().required(),
    roles: Joi.object().keys({
        clinician: Clinician.schema,
        analyst: Joi.boolean().required(),
        researcher: Joi.boolean().required(),
        admin: Joi.boolean().required(),
        root: Joi.boolean().required()
    }),
    resetPassword: Joi.object().keys({
        token: Joi.string().required(),
        expires: Joi.date().required()
    }),
    timeCreated: Joi.date()
});

User.payload = Joi.object().keys({
    username: Joi.string().token().lowercase().required(),
    password: Joi.string().required(),
    email: Joi.string().email().lowercase().required(),
    name: Joi.string().required(),
    gender: Joi.string().allow('male','female'),
    dob: Joi.date(),
    address: Joi.string().allow('').optional(),
    phone: Joi.string().allow('').optional(),
    height: Joi.number(),
    weight: Joi.number()
});


User.indexes = [
    { key: { username: 1, unique: 1 } },
    { key: { email: 1, unique: 1 } }
];


module.exports = User;
