'use strict';
const Joi = require('joi');
const MongoModels = require('mongo-models');

class Account extends MongoModels {
    static create(name, callback) {

        const nameParts = name.trim().split(/\s/);

        const document = {
            name: {
                first: nameParts.shift(),
                middle: nameParts.length > 1 ? nameParts.shift() : undefined,
                last: nameParts.join(' ')
            },
            timeCreated: new Date()
        };

        this.insertOne(document, (err, docs) => {

            if (err) {
                return callback(err);
            }

            callback(null, docs[0]);
        });
    }

    static findByUsername(username, callback) {

        const query = { 'user.name': username.toLowerCase() };

        this.findOne(query, callback);
    }
}


Account.collection = 'accounts';


Account.schema = Joi.object().keys({
    _id: Joi.object(),
    user: Joi.object().keys({
        id: Joi.string().required(),
        name: Joi.string().lowercase().required()
    }),
    name: Joi.object().keys({
        first: Joi.string().required(),
        middle: Joi.string().allow(''),
        last: Joi.string().required()
    }),
    verification: Joi.object().keys({
        complete: Joi.boolean(),
        token: Joi.string()
    }),
    timeCreated: Joi.date()
});

Account.payload = Joi.object().keys({
    name: Joi.string().required()
});


Account.indexes = [
    { key: { 'user.id': 1 } },
    { key: { 'user.name': 1 } }
];


module.exports = Account;
