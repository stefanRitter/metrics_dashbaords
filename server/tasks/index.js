'use strict';

// TASK RUNS DAILY AT MIDNIGHT

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('../config/config')[process.env.NODE_ENV];

// setup datastore
require('../config/mongoose.js')(config);


var updateCollections = require('./updateCollections'),
    updateCountries   = require('./updateCountries'),
    updateWeeks       = require('./updateWeeks');


updateCollections(function () {
  console.log('collections updated');

  updateCountries(function () {
    console.log('countries updated');

    updateWeeks(function () {
      console.log('weeks updated');

      process.exit();
    });
  });
});
