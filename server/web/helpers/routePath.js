'use strict';

module.exports = (route) => {//a helper used to format the object differently

  return route.substring(route.search('/'));
};
