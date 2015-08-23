'use strict';

var Collection = require('mongoose').model('Collection'),
    Boom = require('boom');

var server = {},
    respondToHtml = require('../utils/respondToHTML');


function getCollections (request, reply) {
  if (respondToHtml(request, reply)) { return; }

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
        auth: {
          mode: 'try',
          strategy: 'session'
        },
        plugins: {
          'hapi-auth-cookie': {
            redirectTo: '/'
          }
        }
      }
    }
  ]
  .forEach(function (route) { server.route(route); });
};
