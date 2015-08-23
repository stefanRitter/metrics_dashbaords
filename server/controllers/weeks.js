'use strict';

var Week = require('mongoose').model('Week'),
    Boom = require('boom');

var server = {},
    respondToHtml = require('../utils/respondToHTML');


function getCollections (request, reply) {
  if (respondToHtml(request, reply)) { return; }

  Week.find({}, function (err, weeks) {
    if (err) { return reply(Boom.badImplementation(err)); }
    reply(weeks);
  });
}

module.exports = function (_server) {
  server = _server;

  [
    {
      method: 'GET',
      path: '/weeks',
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
