'use strict';

var Country = require('mongoose').model('Country'),
    Boom = require('boom');

var server = {},
    respondToHtml = require('../utils/respondToHTML');


function getCountries (request, reply) {
  if (respondToHtml(request, reply)) { return; }

  Country.find({}, function (err, countries) {
    if (err) { return reply(Boom.badImplementation(err)); }
    reply(countries);
  });
}

module.exports = function (_server) {
  server = _server;

  [
    {
      method: 'GET',
      path: '/countries',
      config: {
        handler: getCountries,
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
