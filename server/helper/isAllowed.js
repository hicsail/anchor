'use strict';

module.exports = (roles1, roles2) => {//returns True if roles1 has the necessary roles in , else False.

  const set = new Set();
  roles1.forEach((role) => {

    set.add(role);
  });
  let isAllowed = false;
  roles2.forEach((role) => {

    if (set.has(role)){
      isAllowed = true;
    }
  });
  return isAllowed;
};