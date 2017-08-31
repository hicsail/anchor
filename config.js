'use strict';
const Confidence = require('confidence');
const Dotenv = require('dotenv');


Dotenv.config({ silent: true });

const criteria = {
  env: process.env.NODE_ENV
};


const config = {
  $meta: 'This file configures the plot device.',
  projectName: {
    $filter: 'env',
    production: process.env.PROJECT_NAME,
    test: 'Anchor-Test',
    local: process.env.PROJECT_NAME,
    $default: 'Anchor'
  },
  port: {
    web: {
      $filter: 'env',
      test: 9090,
      production: process.env.PORT,
      local: 9000,
      $default: 9000
    }
  },
  authAttempts: {
    forIp: 50,
    forIpAndUser: 7
  },
  cookieSecret: {
    $filter: 'env',
    production: process.env.COOKIE_SECRET,
    local: '!k3yb04rdK4tz~4qu4~k3yb04rdd0gz!',
    $default: '!k3yb04rdK4tz~4qu4~k3yb04rdd0gz!'
  },
  hapiMongoModels: {
    mongodb: {
      uri: {
        $filter: 'env',
        production: process.env.MONGODB_URI,
        test: 'mongodb://localhost:27017/anchor-test',
        local: 'mongodb://localhost:27017/anchor',
        $default: 'mongodb://localhost:27017/anchor'
      }
    },
    autoIndex: true
  },
  nodemailer: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    }
  },
  system: {
    fromAddress: {
      name: 'Anchor',
      address: 'jedireza@gmail.com'
    },
    toAddress: {
      name: 'Anchor',
      address: 'jedireza@gmail.com'
    }
  },
  passwordComplexity: {
    min: 8,
    max: 32,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
    requirementCount: 3
  }
};


const store = new Confidence.Store(config);


exports.get = function (key) {

  return store.get(key, criteria);
};


exports.meta = function (key) {

  return store.meta(key, criteria);
};
