'use strict';

var Boom = require('boom'),
    Batch = require('batch'),
    Path = require('path'),
    publicPath = Path.join(__dirname, '../public'),
    pemPath = Path.join(__dirname, '../config');

var server = {};

var Country = require('mongoose').model('Country');

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


function getBasicData (request, reply) {
  authClient.authorize(function (err, tokens) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': COLLECTIONS_VIEW_ID,
      'start-date': '2015-01-19',
      'end-date': '2016-01-19',
      'metrics': 'ga:pageviews,ga:users,ga:avgTimeOnPage',
      'dimensions': 'ga:country',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var model =  {
            name: row[0],
            views: row[1],
            users: row[2],
            avgTime: row[3]
          }

          Country.findOneAndUpdate({name: model.name}, model, {upsert: true}, function (err, doc) {
            if (err) return done(err);
            done();
          });
        });
      });

      batch.on('progress', function (e) {});

      batch.end(function (err, links) {
        reply(result.rows.length + ' countries created / updated.');
      });
    });
  });
}


function getSharesData (request, reply) {
  authClient.authorize(function (err, tokens) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': COLLECTIONS_VIEW_ID,
      'start-date': '2015-01-19',
      'end-date': '2016-01-19',
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

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var model =  {
            name: row[0]
          }

          switch (row[1]) {
            case 'tweet':
              model.twitterShares = row[2]
              break;
            case 'share':
              model.facebookShares = row[2]
              break;
            case 'shareline':
              model.sharelineShares = row[2]
              break;
          }

          Country.findOneAndUpdate({name: model.name}, model, {upsert: true}, function (err, doc) {
            if (err) return done(err);
            done();
          });
        });
      });

      batch.on('progress', function (e) {});

      batch.end(function (err, links) {
        reply(result.rows.length + ' share events registered.');
      });
    });
  });
}


function getEventsData (request, reply) {
  authClient.authorize(function (err, tokens) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': COLLECTIONS_VIEW_ID,
      'start-date': '2015-01-19',
      'end-date': '2016-01-19',
      'max-results': 10000,
      'metrics': 'ga:uniqueEvents',
      'dimensions': 'ga:country,ga:eventCategory',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
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
          }

          switch (row[1]) {
            case 'show more':
              collection.showMoreClicks = row[2]
              break;
            case 'external link':
              collection.externalClicks = row[2]
              break;
            case 'other navigation':
              collection.otherNavigationClicks = row[2]
              break;
            case 'comment':
              collection.comments = row[2]
              break;
            case 'upvote':
              collection.upvotes = row[2]
              break;
            case 'bookmark':
              collection.bookmarks = row[2]
              break;
          }

          Country.findOneAndUpdate({name: collection.name}, collection, {upsert: true}, function (err, doc) {
            if (err) {
              console.log(err);
              return done(err);
            }
            done();
          });
        });
      });

      batch.on('progress', function (e) {});

      batch.end(function (err, links) {
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
      path: '/ga/countries',
      config: {
        handler: getBasicData,
        auth: 'session'
      }
    },
    {
      method: 'GET',
      path: '/ga/countries_shares',
      config: {
        handler: getSharesData,
        auth: 'session'
      }
    },
    {
      method: 'GET',
      path: '/ga/countries_events',
      config: {
        handler: getEventsData,
        auth: 'session'
      }
    }
  ]
  .forEach(function (route) { server.route(route); });
};
