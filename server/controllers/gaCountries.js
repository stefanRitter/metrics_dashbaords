'use strict';

var Boom = require('boom'),
    Batch = require('batch'),
    Path = require('path'),
    pemPath = Path.join(__dirname, '../config');

var server = {};

var Country = require('mongoose').model('Country');

var googleapis = require('googleapis'),
    JWT = googleapis.auth.JWT,
    analytics = googleapis.analytics('v3');

var SERVICE_ACCOUNT_EMAIL = '431222840368-vm8ghahfqkclispahsacsdv3l89se6ob@developer.gserviceaccount.com';
var SERVICE_ACCOUNT_KEY_FILE = pemPath + '/key.pem';

var COLLECTIONS_VIEW_ID = 'ga:106745667';
var START_DATE = '2015-08-24';
var END_DATE = '2016-01-01';

var authClient = new JWT(
    SERVICE_ACCOUNT_EMAIL,
    SERVICE_ACCOUNT_KEY_FILE,
    null,
    ['https://www.googleapis.com/auth/analytics.readonly']
);


function getBasicData (request, reply) {
  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': COLLECTIONS_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'metrics': 'ga:pageviews,ga:users,ga:avgTimeOnPage,ga:bounceRate',
      'dimensions': 'ga:country',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      if (result.totalResults === 0) {
        return reply('No countries this week...');
      }

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var model =  {
            name: row[0],
            views: row[1],
            users: row[2],
            avgTime: row[3],
            bounceRate: row[4]
          };

          Country.findOneAndUpdate({name: model.name}, model, {upsert: true}, function (err) {
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
        reply(result.rows.length + ' countries created / updated.');
      });
    });
  });
}


function getSharesData (request, reply) {
  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': COLLECTIONS_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'max-results': 10000,
      'metrics': 'ga:socialInteractions',
      'dimensions': 'ga:country,ga:socialInteractionAction',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      console.log('total shares:', result.totalResults);
      if (result.totalResults > 10000) {
        return reply(Boom.badImplementation('TOO MANY EVENTS!!!'));
      }

      if (result.totalResults === 0) {
        return reply('No shares this week...');
      }

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var model =  {
            name: row[0]
          };

          switch (row[1]) {
            case 'tweet':
              model.twitterShares = row[2];
              break;
            case 'share':
              model.facebookShares = row[2];
              break;
            case 'shareline':
              model.sharelineShares = row[2];
              break;
          }

          Country.findOneAndUpdate({name: model.name}, model, {upsert: true}, function (err) {
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
        reply(result.rows.length + ' share events registered.');
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
      'ids': COLLECTIONS_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'max-results': 10000,
      'metrics': 'ga:uniqueEvents',
      'dimensions': 'ga:country,ga:eventCategory',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      if (result.totalResults === 0) {
        return reply('No events this week...');
      }

      console.log('total events:', result.totalResults);
      if (result.totalResults > 10000) {
        return reply(Boom.badImplementation('TOO MANY EVENTS!!!'));
      }

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var collection =  {
            name: row[0]
          };

          switch (row[1]) {
            case 'show more':
              collection.showMoreClicks = row[2];
              break;
            case 'external link':
              collection.externalClicks = row[2];
              break;
            case 'other navigation':
              collection.otherNavigationClicks = row[2];
              break;
            case 'comment':
              collection.comments = row[2];
              break;
            case 'upvote':
              collection.upvotes = row[2];
              break;
            case 'bookmark':
              collection.bookmarks = row[2];
              break;
          }

          Country.findOneAndUpdate({name: collection.name}, collection, {upsert: true}, function (err) {
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

function getMostPopularCollection (request, reply) {
  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': COLLECTIONS_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'metrics': 'ga:users',
      'dimensions': 'ga:country,ga:pagePath',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      if (result.totalResults === 0) {
        return reply('No collections this week...');
      }

      var matrix = {};
      result.rows.forEach(function (row) {
        if (!matrix[row[0]]) { matrix[row[0]] = []; }

        matrix[row[0]].push({
          users: row[2],
          collection: row[1]
        });
      });

      var batch = new Batch();

      Object.keys(matrix).forEach(function (country) {
        // sort by most popular
        matrix[country].sort(function (a, b) {
          return b.users - a.users;
        });

        batch.push(function (done) {
          var model =  {
            name: country,
            collection1: matrix[country][0].collection,
            collection2: (matrix[country][1] ? matrix[country][1] : {}).collection,
            collection3: (matrix[country][2] ? matrix[country][2] : {}).collection,
          };

          Country.findOneAndUpdate({name: model.name}, model, {upsert: true}, function (err) {
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
        reply(result.rows.length + ' collections by country processed.');
      });
    });
  });
}

module.exports = function (_server) {
  server = _server;

  [
    {
      method: 'GET',
      path: '/ga/countries',
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
      path: '/ga/countries_shares',
      config: {
        handler: getSharesData,
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
      path: '/ga/countries_events',
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
      path: '/ga/countries_popular',
      config: {
        handler: getMostPopularCollection,
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
