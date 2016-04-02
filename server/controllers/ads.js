'use strict';

var Ad = require('mongoose').model('Ad'),
    Boom = require('boom');

var server = {},
    respondToHtml = require('../utils/respondToHTML');


function getAds (request, reply) {
  if (respondToHtml(request, reply)) { return; }

  Ad.find({}, function (err, ads) {
    if (err) { return reply(Boom.badImplementation(err)); }
    reply(ads);
  });
}

module.exports = function (_server) {
  server = _server;

  [
    {
      method: 'GET',
      path: '/ads',
      config: {
        handler: getAds,
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
