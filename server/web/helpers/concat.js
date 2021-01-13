'use strict';

module.exports = (...args) => {

  let string = '' + args[0];
  args.forEach((item, index) => {

    if (index > 0 && index < args.length - 1) {//ignores the last item in the parameter which contains the function info for some reason.
      string += '_' + item;
    }
  });
  return string;
};
