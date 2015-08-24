'use strict';

var Path = require('path'),
    publicPath = Path.join(__dirname, '../public');

console.log(publicPath + 'html/index.html');

module.exports = function (config, server) {

  require('../controllers/auth.js')(server);
  require('../controllers/collections.js')(server);
  require('../controllers/countries.js')(server);
  require('../controllers/weeks.js')(server);

  require('../controllers/gaCollections.js')(server);
  require('../controllers/gaCountries.js')(server);
  require('../controllers/gaWeeks.js')(server);

  server.route({
    method: 'GET',
    path: '/assets/{param*}',
    handler: {
      directory: {
        path: publicPath,
        defaultExtension: 'html'
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/favicon.ico',
    handler: {
      file: publicPath + '/img/favicon.ico'
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: {
      file: publicPath + '/html/index.html'
    }
  });

  return server;
};
