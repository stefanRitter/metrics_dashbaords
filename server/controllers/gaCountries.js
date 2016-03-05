'use strict';

var server = {};

var Boom = require('boom'),
    Batch = require('batch');

var Country = require('mongoose').model('Country');

var googleapis = require('googleapis'),
    analytics = googleapis.analytics('v3');

var gaSetup = require('../utils/gaSetup');

var ALL_DATA_VIEW_ID = gaSetup.ALL_DATA_VIEW_ID;
var COLLECTIONS_VIEW_ID = gaSetup.COLLECTIONS_VIEW_ID;
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
      'ids': ALL_DATA_VIEW_ID,
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
            bounceRate: Math.round(row[4])
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
      'ids': ALL_DATA_VIEW_ID,
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
            case 'linkedin':
              model.linkedinShares = row[2];
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
      'ids': ALL_DATA_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'max-results': 10000,
      'metrics': 'ga:totalEvents',
      'dimensions': 'ga:country,ga:eventCategory',
    }, function (err, result) {
      /* jshint maxcomplexity: false */

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
          var country =  {
            name: row[0]
          };

          switch (row[1]) {
            case 'show more':
              country.showMoreClicks = row[2];
              break;
            case 'external link':
              country.externalClicks = row[2];
              break;
            case 'other navigation':
              country.otherNavigationClicks = row[2];
              break;
            case 'comment':
              country.comments = row[2];
              break;
            case 'upvote':
              country.upvotes = row[2];
              break;
            case 'bookmark':
              country.bookmarks = row[2];
              break;
            case 'banner':
              country.bannerClicks = row[2];
              break;
            case 'twitterfeedclick':
              country.twitterfeedClick = row[2];
              break;
            case 'twitterfeedscroll':
              country.twitterfeedScroll = row[2];
              break;
            case 'register':
              country.pagination = row[2];
              break;
            case 'emailus':
              country.pagination = row[2];
              break;
            case 'placeholder':
              country.pagination = row[2];
              break;
          }

          Country.findOneAndUpdate({name: country.name}, country, {upsert: true}, function (err) {
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
      'metrics': 'ga:pageviews',
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
        // if no country create one
        if (!matrix[row[0]]) { matrix[row[0]] = {}; }

        // remove ? params from title
        var cleanTitle = row[1].split('?')[0];
        if (!matrix[row[0]][cleanTitle]) { matrix[row[0]][cleanTitle] = 0; }
        matrix[row[0]][cleanTitle] += parseInt(row[2],10);
      });

      var batch = new Batch();

      Object.keys(matrix).forEach(function (country) {
        // sort by most popular
        var collectionArr = [];

        Object.keys(matrix[country]).forEach(function (collectionTitle) {
          collectionArr.push({collection: collectionTitle, users: matrix[country][collectionTitle]});
        });

        collectionArr.sort(function (a, b) {
          return b.users - a.users;
        });

        batch.push(function (done) {
          var model =  {
            name: country,
            collection1: collectionArr[0].collection,
            collection2: (collectionArr[1] ? collectionArr[1] : {}).collection,
            collection3: (collectionArr[2] ? collectionArr[2] : {}).collection,
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


function getBannerClicks (request, reply) {
  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': ALL_DATA_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'max-results': 10000,
      'metrics': 'ga:totalEvents',
      'dimensions': 'ga:country,ga:eventCategory,ga:eventAction',
    }, function (err, result) {
      /* jshint maxcomplexity: false */

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
          var country =  {
            name: row[0]
          };

          switch (row[1]) {
            case 'banner':
              if (row[2] === 'top') {
                country.bannerTopClicks = row[3];
              } else {
                country.bannerBottomClicks = row[3];
              }
              break;
          }

          Country.findOneAndUpdate({name: country.name}, country, {upsert: true}, function (err) {
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


function gettwitterfeed (request, reply) {
  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': ALL_DATA_VIEW_ID,
      'start-date': START_DATE,
      'end-date': END_DATE,
      'max-results': 10000,
      'metrics': 'ga:totalEvents',
      'dimensions': 'ga:country,ga:eventCategory,ga:eventAction',
    }, function (err, result) {
      /* jshint maxcomplexity: false */

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
      var countries = {};

      result.rows.forEach(function (row) {
        switch (row[1]) {
          case 'twitterfeed':
            countries[row[0]] = countries[row[0]] || { twitterfeedClick: 0, twitterfeedScroll: 0 };

            if (row[2] === 'click') {
              countries[row[0]].twitterfeedClick = parseInt(row[3], 10);
            }
            if (row[2] === 'scroll') {
              countries[row[0]].twitterfeedScroll = parseInt(row[3], 10);
            }
            break;
        }

      });

      Object.keys(countries).forEach(function (countryName) {
        batch.push(function (done) {
          Country.findOne({name: countryName}, function (err, model) {
            if (err) {
              console.log(err);
              return done(err);
            }

            model.twitterfeedClick  += (model.twitterfeedClick || 0)  + countries[countryName].twitterfeedClick;
            model.twitterfeedScroll += (model.twitterfeedScroll || 0) + countries[countryName].twitterfeedScroll;

            model.save(function (err) {
              if (err) {
                console.log(err);
                return done(err);
              }
              console.log('done: ', countryName);
              done();
            });
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
    },
    {
      method: 'GET',
      path: '/ga/countries_bannerclicks',
      config: {
        handler: getBannerClicks,
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
      path: '/ga/countries_twitterfeed',
      config: {
        handler: gettwitterfeed,
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
