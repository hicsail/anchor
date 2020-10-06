'use strict';
const Config = require('./config');
const Joi = require('joi');
const MongoModels = require('./server/anchor/hapi-anchor-model');
const Mongodb = require('mongodb');
const Promptly = require('promptly');
const User = require('./server/models/user');
const PasswordComplexity = require('joi-password-complexity');


async function main() {
  const options = {
    default: 'mongodb://localhost:27017/anchor'
  };
  const mongodbUri = await Promptly.prompt(`MongoDB URI: (${options.default})`, options);


  const testMongo = await Mongodb.MongoClient.connect(mongodbUri, {});

  const rootEmail = await Promptly.prompt('Root user email:');

  const  rootPassword = await Promptly.password('Root user password:');
  const complexityOptions = Config.get('/passwordComplexity');
  const rootPasswordCheck = Joi.validate(results.rootPassword, new PasswordComplexity(complexityOptions));


  const connect = await MongoModels.connect(mongodbUri, {});
  const rootUser = await User.findOne({ username: 'root' });

  if (rootUser) {
    console.error(Error('Root User already exists'));
    return process.exit(1);
  }

  const userEmail = await User.findOne({ email: results.rootEmail });
  // replaces emailCheck
  if (userEmail != null) {
    console.err(Error('Email is in use'));
  }
  const passwordHash = await User.generatePasswordHash(results.rootPassword);
  const document = {
    _id: User.ObjectId('000000000000000000000000'),
    isActive: true,
    username: 'root',
    name: 'Root',
    password: passResults.passwordHash.hash,
    email: results.rootEmail.toLowerCase(),
    roles: {
      root: true
    },
    timeCreated: new Date()
  };
  const user = await User.insertOne(document);
  console.log('Setup complete.');
  process.exit(0);

  /*
   *  if (err) {
   *    console.error('Setup failed.');
   *    console.error(err);
   *    return process.exit(1);
   *  }
   *
   *  console.log('Setup complete.');
   *  process.exit(0);
   */
}
