'use strict';
const Confidence = require('confidence');
const Dotenv = require('dotenv');


Dotenv.config({ silent: true });

const criteria = {
  env: process.env.NODE_ENV
};


const config = {
  $meta: 'This file configures the plot device.',
  projectName: 'Frame',
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
        test: 'mongodb://localhost:27017/frame-test',
        local: 'mongodb://localhost:27017/frame',
        $default: 'mongodb://localhost:27017/frame'
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
      name: 'Frame',
      address: 'jedireza@gmail.com'
    },
    toAddress: {
      name: 'Frame',
      address: 'jedireza@gmail.com'
    }
  }
};


const store = new Confidence.Store(config);


exports.get = function (key) {

  return store.get(key, criteria);
};


exports.meta = function (key) {

  return store.meta(key, criteria);
};
