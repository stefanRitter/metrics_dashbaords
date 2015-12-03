'use strict';

var server = {};

var Boom = require('boom'),
    Batch = require('batch'),
    Path = require('path'),
    publicPath = Path.join(__dirname, '../public');

var Collection = require('mongoose').model('Collection');

var googleapis = require('googleapis'),
    analytics = googleapis.analytics('v3');

var gaSetup = require('../utils/gaSetup');

var COLLECTIONS_VIEW_ID = gaSetup.COLLECTIONS_VIEW_ID;
var START_DATE = gaSetup.START_DATE;
var END_DATE = gaSetup.END_DATE;
var authClient = gaSetup.authClient;


function getTitle (path) {
  var splitted = path.split('/');
  return splitted[splitted.length-1].replace(/-/g,' ');
}


function basicCollectionsData (request, reply) {
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
      'dimensions': 'ga:pagePath',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      if (result.totalResults === 0) {
        return reply('No collections this week...');
      }

      var batch = new Batch();

      result.rows.forEach(function (row) {
        batch.push(function (done) {
          var collection =  {
            url: row[0],
            title: getTitle(row[0]),
            views: row[1],
            users: row[2],
            avgTime: row[3],
            bounceRate: Math.round(row[4])
          };

          Collection.findOneAndUpdate({url: row[0]}, collection, {upsert: true}, function (err) {
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
        reply(result.rows.length + ' collections created / updated.');
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
      'dimensions': 'ga:pagePath,ga:socialInteractionAction',
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
          var collection =  {
            url: row[0],
            title: getTitle(row[0])
          };

          switch (row[1]) {
            case 'tweet':
              collection.twitterShares = row[2];
              break;
            case 'share':
              collection.facebookShares = row[2];
              break;
            case 'shareline':
              collection.sharelineShares = row[2];
              break;
            case 'linkedin':
              collection.linkedinShares = row[2];
              break;
          }

          Collection.findOneAndUpdate({url: row[0]}, collection, {upsert: true}, function (err) {
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
      'dimensions': 'ga:pagePath,ga:eventCategory',
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
            url: row[0],
            title: getTitle(row[0])
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
            case 'banner':
              collection.bannerClicks = row[2];
              break;
            case 'add story':
              collection.addStoryClicks = row[2];
              break;
            case 'see all stories':
              collection.showAllStories = row[2];
              break;
            case 'pagination':
              collection.pagination = row[2];
              break;
          }

          Collection.findOneAndUpdate({url: row[0]}, collection, {upsert: true}, function (err) {
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


function consolidateCollections (request, reply) {
  Collection.find({}, function (err, collections) {
    /* jshint maxstatements: false */
    if (err) { return reply(Boom.badImplementation(err)); }

    var consolidatedCollections = {};

    collections.forEach(function (collection) {
      var cleanTitle = collection.title.split('?')[0];

      if (!consolidatedCollections[cleanTitle]) {
        consolidatedCollections[cleanTitle] = collection;
        consolidatedCollections[cleanTitle].title = cleanTitle;
        consolidatedCollections[cleanTitle].url = collection.url.split('?')[0];
        consolidatedCollections[cleanTitle].__v = undefined;
        consolidatedCollections[cleanTitle]._id = undefined;
      } else {
        consolidatedCollections[cleanTitle].users += collection.users;

        var avg1 = collection.avgTime * collection.views;
        var avg2 = consolidatedCollections[cleanTitle].avgTime * consolidatedCollections[cleanTitle].views;
        var views = consolidatedCollections[cleanTitle].views + collection.views;
        consolidatedCollections[cleanTitle].avgTime = (avg1 + avg2)/views;

        var bounces1 = consolidatedCollections[cleanTitle].bounceRate*consolidatedCollections[cleanTitle].views/100;
        var bounces2 = collection.bounceRate*collection.views/100;
        var totalBounces = bounces1 + bounces2;
        var onePercent = views/100;
        consolidatedCollections[cleanTitle].bounceRate = totalBounces/onePercent;

        consolidatedCollections[cleanTitle].views = views;
        consolidatedCollections[cleanTitle].bannerClicks += collection.bannerClicks;
        consolidatedCollections[cleanTitle].showMoreClicks += collection.showMoreClicks;
        consolidatedCollections[cleanTitle].externalClicks += collection.externalClicks;
        consolidatedCollections[cleanTitle].otherNavigationClicks += collection.otherNavigationClicks;
        consolidatedCollections[cleanTitle].comments += collection.comments;
        consolidatedCollections[cleanTitle].upvotes += collection.upvotes;
        consolidatedCollections[cleanTitle].bookmarks += collection.bookmarks;
        consolidatedCollections[cleanTitle].twitterShares += collection.twitterShares;
        consolidatedCollections[cleanTitle].facebookShares += collection.facebookShares;
        consolidatedCollections[cleanTitle].linkedinShares += collection.linkedinShares;
        consolidatedCollections[cleanTitle].sharelineShares += collection.sharelineShares;
        consolidatedCollections[cleanTitle].addStoryClicks += collection.addStoryClicks;
        consolidatedCollections[cleanTitle].showAllStories += collection.showAllStories;
        consolidatedCollections[cleanTitle].pagination += collection.pagination;
      }
    });

    // delete all collections and insert the consolidated ones
    Collection.remove({}, function () {
      if (err) { return reply(Boom.badImplementation(err)); }

      var batch = new Batch();

      Object.keys(consolidatedCollections).forEach(function (title) {
        consolidatedCollections[title].bounceRate = Math.round(consolidatedCollections[title].bounceRate);

        batch.push(function (done) {
          Collection.findOneAndUpdate({title: title}, consolidatedCollections[title], {upsert: true}, function (err) {
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
        reply('done');
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
          file: publicPath + '/html/index.html'
        },
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
      path: '/ga/collections',
      config: {
        handler: basicCollectionsData,
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
      path: '/ga/collections_shares',
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
      path: '/ga/collections_events',
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
      path: '/ga/consolidate_collections',
      config: {
        handler: consolidateCollections,
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
