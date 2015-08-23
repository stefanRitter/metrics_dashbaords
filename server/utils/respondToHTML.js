'use strict';

var Negotiator = require('negotiator');

var Path = require('path'),
    publicPath = Path.join(__dirname, '../public');

module.exports = function (request, reply) {
  var mediaTypes = new Negotiator(request).mediaTypes();

  if (mediaTypes.indexOf('text/html') > -1) {
    console.log('respond to HTML - sending angular app');
    reply.file(publicPath + '/html/index.html');
    return true;
  }

  return false;
};
