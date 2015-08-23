'use strict';

var Collection = require('mongoose').model('Collection'),
    Boom = require('boom');

var server = {};


function getCollections (request, reply) {
  Collection.find({}, function (err, collections) {
    if (err) { return reply(Boom.badImplementation(err)); }
    reply(collections);
  });
}

module.exports = function (_server) {
  server = _server;

  [
    {
      method: 'GET',
      path: '/collections',
      config: {
        handler: getCollections,
        auth: 'session'
      }
    }
  ]
  .forEach(function (route) { server.route(route); });
};
