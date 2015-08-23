'use strict';

var Boom = require('boom'),
    Batch = require('batch'),
    Path = require('path'),
    publicPath = Path.join(__dirname, '../public'),
    pemPath = Path.join(__dirname, '../config');

var server = {};

var Collection = require('mongoose').model('Collection');

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


function basicCollectionsData (request, reply) {
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
      'dimensions': 'ga:pagePath',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var collection =  {
            url: row[0],
            title: row[0].split('/')[5].replace(/-/g,' '),
            views: row[1],
            avgTime: row[2]
          }

          Collection.findOneAndUpdate({url: row[0]}, collection, {upsert: true}, function (err, doc) {
            if (err) return done(err);
            done();
          });
        });
      });

      batch.on('progress', function (e) {});

      batch.end(function (err, links) {
        reply(result.rows.length + ' collections created / updated.');
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
      'dimensions': 'ga:pagePath,ga:socialInteractionAction',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      if (result.totalResults > 10000) {
        return reply(Boom.badImplementation('TOO MANY EVENTS!!!'));
      }

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var collection =  {
            url: row[0],
            twitterShares: row[0].split('/')[5].replace(/-/g,' ')
          }

          switch (row[1]) {
            case 'tweet':
              collection.twitterShares = row[2]
              break;
            case 'share':
              collection.facebookShares = row[2]
              break;
            case 'shareline':
              collection.sharelineShares = row[2]
              break;
          }

          Collection.findOneAndUpdate({url: row[0]}, collection, {upsert: true}, function (err, doc) {
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


module.exports = function (_server) {
  server = _server;

  [
    {
      method: 'GET',
      path: '/ga',
      config: {
        handler: {
          file: publicPath + '/html/ga/index.html'
        },
        auth: 'session'
      }
    },
    {
      method: 'GET',
      path: '/ga/collections',
      config: {
        handler: basicCollectionsData,
        auth: 'session'
      }
    },
    {
      method: 'GET',
      path: '/ga/collections_shares',
      config: {
        handler: getSharesData,
        auth: 'session'
      }
    }
  ]
  .forEach(function (route) { server.route(route); });
};
