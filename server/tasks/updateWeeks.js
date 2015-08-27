'use strict';

function updateCollections (cb) {
  var server = require('./taskServer.js');
  require('../controllers/gaWeeks.js')(server);

  server['/ga/weeks']({}, function () {
    server['/ga/weeks_shares']({}, function () {
      server['/ga/weeks_events']({}, function () {
        server['/ga/weeks_popular']({}, function () {
          server['/ga/weeks_login']({}, function () {
            if (cb) { cb(); }
            else { process.exit(); }
          });
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
