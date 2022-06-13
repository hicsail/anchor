'use strict';
const Config = require('./config');
const Joi = require('joi');
const AnchorModels = require('./server/anchor/anchor-model');
const Mongodb = require('mongodb');
const Promptly = require('promptly');
const User = require('./server/models/user');
const PasswordComplexity = require('joi-password-complexity');


const main = async function () {

  const options = {
    default: 'mongodb://localhost:27017/anchor'
  };
  const mongodbUri = await Promptly.prompt(`MongoDB URI: (${options.default})`, options);


  const testMongo = await Mongodb.MongoClient.connect(mongodbUri, {});

  if (!testMongo) {
    console.error('Failed to connect to Mongodb.');
  }

  const rootEmail = await Promptly.prompt('Root user email:');

  const rootPassword = await Promptly.password('Root user password:');
  const complexityOptions = Config.get('/passwordComplexity');
  Joi.validate(rootPassword, new PasswordComplexity(complexityOptions));


  console.log(mongodbUri);
  const connection = { 'uri': mongodbUri, 'db': 'anchor' };
  await AnchorModels.connect(connection, {});

  const rootUser = await User.findOne({ username: 'root' });

  if (rootUser) {
    console.error(Error('Root User already exists'));
    return process.exit(1);
  }

  const userEmail = await User.findOne({ email: rootEmail });
  // replaces emailCheck
  if (userEmail) {
    console.err(Error('Email is in use'));
  }
  const passwordHash = await User.generatePasswordHash(rootPassword);
  const document = {
    _id: User.ObjectId('000000000000000000000000'),
    isActive: true,
    username: 'root',
    name: 'Root',
    password: passwordHash.hash,
    email: rootEmail.toLowerCase(),
    roles: {
      root: true
    },
    timeCreated: new Date()
  };
  await User.insertOne(document);
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
};
main();
