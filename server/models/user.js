'use strict';
const Assert = require('assert');
const Bcrypt = require('bcrypt');
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');


class User extends AnchorModel {

  static async generatePasswordHash(password) {

    Assert.ok(password, 'Missing pasword arugment.');
    const salt = await (Bcrypt.genSalt(10));
    const hash = await (Bcrypt.hash(password,salt));

    return { password, hash };

  }

  static async create(document) {

    const self = this;

    Assert.ok(document.username, 'Missing username argument');
    Assert.ok(document.password, 'Missing password argument');
    Assert.ok(document.email, 'Missing email argument.');
    Assert.ok(document.name, 'Missing name argument.');

    const passwordHash = await this.generatePasswordHash(document.password);
    document =  new this({
      isActive: true,
      inStudy: true,
      username: document.username.toLowerCase(),
      password: passwordHash.hash,
      email: document.email.toLowerCase(),
      name: document.name,
      roles: {},
      studyID: null,
      timeCreated: new Date()
    });

    const users = await self.insertOne(document);

    users[0].password = passwordHash.password;

    return users[0];

  }


  static async findByCredentials(username, password) {

    Assert.ok(username,'Missing username argument.');
    Assert.ok(password,'Missing password argument.');

    const query = { isActive: true };

    if (username.indexOf('@') > -1) {
      query.email = username.toLowerCase();
    }

    else {
      query.username = username.toLowerCase();
    }

    const user = await this.findOne(query);

    if (!user) {
      return;
    }

    const passwordMatch = await Bcrypt.compare(password,user.password);

    if (passwordMatch) {
      return user;
    }

  }


  static findByUsername(username) {

    Assert.ok(username, 'Misisng username argument.');

    const query = { username: username.toLowerCase() };

    return this.findOne(query);
  }



}


User.collectionName = 'users';

User.routes = {
  get: {
    disabled:false
  },
  create: {
    disabled:false,
    payload: User.payload
  }
};


User.schema = Joi.object({
  _id: Joi.object(),
  isActive: Joi.boolean().default(true),
  username: Joi.string().token().lowercase().required(),
  password: Joi.string(),
  name: Joi.string(),
  inStudy: Joi.boolean().default(true),
  email: Joi.string().email().lowercase().required(),
  permissions: Joi.object(),
  roles: Joi.array().items(Joi.string()),
  resetPassword: Joi.object({
    token: Joi.string().required(),
    expires: Joi.date().required()
  }),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

User.payload = Joi.object({
  username: Joi.string().token().lowercase().invalid('root').required(),
  password: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  name: Joi.string().required(),
  permissions: Joi.object(),
  roles: Joi.array().items(Joi.string())
});


User.indexes = [
  { key: { username: 1, unique: 1 } },
  { key: { email: 1, unique: 1 } }
];


module.exports = User;
