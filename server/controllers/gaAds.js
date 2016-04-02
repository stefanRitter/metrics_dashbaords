'use strict';

var server = {};

var Boom = require('boom'),
    Batch = require('batch');

var Ad = require('mongoose').model('Ad');

var googleapis = require('googleapis'),
    analytics = googleapis.analytics('v3');

var gaSetup = require('../utils/gaSetup');

var START_DATE = gaSetup.START_DATE;
var END_DATE = gaSetup.END_DATE;
var authClient = gaSetup.authClient;


function getBasicData (request, reply) {
  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': gaSetup.ALL_DATA_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'metrics': 'ga:pageviews'
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      if (result.totalResults === 0) {
        return reply('No data this week...');
      }

      var row = result.rows[0];
      var ad = {
        views: row[0]
      };

      Ad.findOneAndUpdate({myId: 10}, ad, {upsert: true}, function (err) {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err));
        }
        reply(result.rows.length + ' week created / updated.');
      });
    });
  });
}



function getEventsData (request, reply) {
  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': gaSetup.ALL_DATA_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'max-results': 10000,
      'metrics': 'ga:totalEvents',
      'dimensions': 'ga:eventCategory',
    }, function (err, result) {
      /* jshint maxcomplexity: false */

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      console.log('total events:', result.totalResults);
      if (result.totalResults > 10000) {
        return reply(Boom.badImplementation('TOO MANY EVENTS!!!'));
      }

      if (result.totalResults === 0) {
        return reply('No events this week...');
      }

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var collection =  {};

          switch (row[0]) {
            case 'banner':
              collection.bannerClicksHomepage = row[1];
              break;
            case 'placeholder':
              collection.bottomBannerClicks = row[1];
              break;
            case 'placeholder_big':
              collection.assetPagesBannerClicks = row[1];
              break;
          }

          Ad.findOneAndUpdate({myId: 10}, collection, {upsert: true}, function (err) {
            if (err) {
              console.log(err);
              return done(err);
            }
            done();
          });
        });
      });

      batch.on('progress', function () {});

      batch.end(function () {
        reply(result.rows.length + ' events registered.');
      });
    });
  });
}

function getCollectionBannerData (request, reply) {
  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': gaSetup.ALL_DATA_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'max-results': 10000,
      'metrics': 'ga:totalEvents',
      'dimensions': 'ga:eventCategory',
    }, function (err, result) {
      /* jshint maxcomplexity: false */

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      console.log('total events:', result.totalResults);
      if (result.totalResults > 10000) {
        return reply(Boom.badImplementation('TOO MANY EVENTS!!!'));
      }

      if (result.totalResults === 0) {
        return reply('No events this week...');
      }

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var collection =  {
            bannerClicksCollections: 0
          };

          switch (row[0]) {
            case 'banner':
              collection.bannerClicksCollections = row[1];
              break;
          }

          Ad.findOneAndUpdate({myId: 10}, collection, {upsert: true}, function (err) {
            if (err) {
              console.log(err);
              return done(err);
            }
            done();
          });
        });
      });

      batch.on('progress', function () {});

      batch.end(function () {
        reply(result.rows.length + ' events registered.');
      });
    });
  });
}


module.exports = function (_server) {
  server = _server;

  [
    {
      method: 'GET',
      path: '/ga/ads_basic',
      config: {
        handler: getBasicData,
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
    },
    {
      method: 'GET',
      path: '/ga/ads_events',
      config: {
        handler: getEventsData,
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
    },
    {
      method: 'GET',
      path: '/ga/ads_collection_events',
      config: {
        handler: getCollectionBannerData,
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
    },
  ]
  .forEach(function (route) { server.route(route); });
};
