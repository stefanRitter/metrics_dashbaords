'use strict';

function updateCollections (cb) {
  var server = require('./taskServer.js');
  require('../controllers/gaCountries.js')(server);

  server['/ga/countries']({}, function () {
    server['/ga/countries_shares']({}, function () {
      server['/ga/countries_events']({}, function () {
        server['/ga/countries_popular']({}, function (response) {
          console.log(response);

          if (cb) { cb(); }
          else { process.exit(); }
        });
      });
    });
  });
}


module.exports = updateCollections;

// if called independently
if (!module.parent) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  var config = require('../config/config')[process.env.NODE_ENV];

  // setup datastore
  require('../config/mongoose.js')(config);

  updateCollections();
}
