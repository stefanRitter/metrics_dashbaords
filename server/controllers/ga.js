'use strict';

var Path = require('path'),
    Boom = require('boom'),
    pemPath = Path.join(__dirname, '../config');

var server = {};

var googleapis = require('googleapis'),
    JWT = googleapis.auth.JWT,
    analytics = googleapis.analytics('v3');

var SERVICE_ACCOUNT_EMAIL = '431222840368-vm8ghahfqkclispahsacsdv3l89se6ob@developer.gserviceaccount.com';
var SERVICE_ACCOUNT_KEY_FILE = pemPath + '/key.pem';

var COLLECTIONS_VIEW_ID = 'ga:106745667';

var authClient = new JWT(
    SERVICE_ACCOUNT_EMAIL,
    SERVICE_ACCOUNT_KEY_FILE,
    null,
    ['https://www.googleapis.com/auth/analytics.readonly']
);


function testGA (request, reply) {
  authClient.authorize(function(err, tokens) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': COLLECTIONS_VIEW_ID,
      'start-date': '2015-01-19',
      'end-date': '2016-01-19',
      'metrics': 'ga:visits'
    }, function(err, result) {
      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      console.log(result);
      reply(result);
    });
  });
}


module.exports = function (_server) {
  server = _server;

  [
    {
      method: 'GET',
      path: '/ga',
      config: {
        handler: testGA
      }
    }
  ]
  .forEach(function (route) { server.route(route); });
};
