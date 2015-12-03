'use strict';

function updateCollections (cb) {
  var server = require('./taskServer.js');
  require('../controllers/gaCollections.js')(server);

  server['/ga/collections']({}, function (response) {
    console.log(response);
    server['/ga/collections_shares']({}, function (response) {
      console.log(response);
      server['/ga/collections_events']({}, function (response) {
        console.log(response);
        server['/ga/consolidate_collections']({}, function (response) {
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
