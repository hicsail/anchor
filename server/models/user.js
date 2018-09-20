'use strict';
const AnchorModel = require('../anchor/anchor-model');
const Assert = require('assert');
const Crypto = require('../crypto');
const Hoek = require('hoek');
const Joi = require('joi');

class User extends AnchorModel {

  static async generatePasswordHash(password) {

    Assert.ok(password, 'Missing pasword arugment.');
    const salt = await Crypto.genSalt(10);
    const hash = await Crypto.hash(password,salt);

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
      roles: []
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

    const passwordMatch = await Crypto.compare(password,user.password);

    if (passwordMatch) {
      return user;
    }

  }

  static findByUsername(username) {

    Assert.ok(username, 'Misisng username argument.');

    const query = { username: username.toLowerCase() };

    return this.findOne(query);
  }

  static findByEmail(email) {

    Assert.ok(email, 'Misisng email argument.');

    const query = { email: email.toLowerCase() };

    return this.findOne(query);
  }
}

User.collectionName = 'users';

User.schema = Joi.object({
  _id: Joi.object(),
  isActive: Joi.boolean().default(true).label('Is Active'),
  username: Joi.string().token().lowercase().required().label('Username'),
  password: Joi.string().label('Password'),
  name: Joi.string().label('Name'),
  inStudy: Joi.boolean().default(true).label('In Study'),
  email: Joi.string().email().lowercase().required().label('Email'),
  permissions: Joi.object(),
  roles: Joi.array().items(Joi.string()),
  resetPassword: Joi.object({
    token: Joi.string().required(),
    expires: Joi.date().required()
  }),
  createdAt: Joi.date().label('Created At'),
  updatedAt: Joi.date().label('Updated At')
});

User.payload = Joi.object({
  username: Joi.string().token().lowercase().invalid('root').required().label('Username'),
  password: Joi.string().required().label('Password'),
  email: Joi.string().email().lowercase().required().label('Email'),
  name: Joi.string().required().label('Name')
});

User.permissionPayload =  Joi.object({
  permissions: Joi.object()
});

User.rootSignUpPayload = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required()
});

User.columns = [
  { headerName: 'Id', field: '_id' },
  { headerName: 'Name', field: 'name' },
  { headerName: 'Username', field: 'username' },
  { headerName: 'Email', field: 'email' },
  { headerName: 'Created At', field: 'createdAt', render: (x) => new Date(x).toLocaleString() },
  { headerName: 'View', field: '_id', cellRenderer: 'buttonCellRenderer' }
];

User.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: true,
    payload: User.payload
  },
  update: {
    payload: User.payload
  },
  insertMany: {
    payload: User.payload
  }
});

User.sidebar = {
  name: 'Users'
};

User.lookups = [{
  from: require('./role'),
  local: 'roles',
  foreign: '_id',
  as: 'roles',
  operator: '$in'
}];

User.indexes = [
  { key: { username: 1, unique: 1 } },
  { key: { email: 1, unique: 1 } }
];

module.exports = User;
