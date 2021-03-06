'use strict';

function updateCollections (cb, date) {
  var server = require('./taskServer.js');
  require('../controllers/gaWeeks.js')(server);

  server['/ga/weeks']({}, function () {
    server['/ga/weeks_shares']({}, function () {
      server['/ga/weeks_events']({}, function () {
        server['/ga/weeks_popular']({}, function () {
          server['/ga/weeks_login']({}, function () {
            server['/ga/weeks_bannerclicks']({}, function () {
              if (cb) { cb(); }
              else { process.exit(); }
            }, date);
          }, date);
        }, date);
      }, date);
    }, date);
  }, date);
}


module.exports = updateCollections;

// if called independently
if (!module.parent) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  var config = require('../config/config')[process.env.NODE_ENV];

  // setup datastore
  require('../config/mongoose.js')(config);

  updateCollections(false, process.argv[2]);
}
