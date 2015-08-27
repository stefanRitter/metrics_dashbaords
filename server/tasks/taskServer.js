'use strict';

module.exports = {
  route: function (route) {
    this[route.path] = route.config.handler;
  }
};
