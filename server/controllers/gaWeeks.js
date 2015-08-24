'use strict';

var Boom = require('boom'),
    Batch = require('batch'),
    Path = require('path'),
    pemPath = Path.join(__dirname, '../config');

var server = {};

var Week = require('mongoose').model('Week');

var googleapis = require('googleapis'),
    JWT = googleapis.auth.JWT,
    analytics = googleapis.analytics('v3');

var SERVICE_ACCOUNT_EMAIL = '431222840368-vm8ghahfqkclispahsacsdv3l89se6ob@developer.gserviceaccount.com';
var SERVICE_ACCOUNT_KEY_FILE = pemPath + '/key.pem';

var ALL_DATA_VIEW_ID = 'ga:106585530';

var authClient = new JWT(
    SERVICE_ACCOUNT_EMAIL,
    SERVICE_ACCOUNT_KEY_FILE,
    null,
    ['https://www.googleapis.com/auth/analytics.readonly']
);



function getDates () {
  var today  = new Date(),
      target = new Date();

  // ISO week date weeks start on monday
  // so correct the day number
  var dayNr = (today.getDay() + 6) % 7;

  var monday = new Date(today.setDate(today.getDate() - dayNr));
  var sunday = new Date(today.setDate(today.getDate() - dayNr + 6));

  // Set the target to the thursday of this week so the
  // target date is in the right year
  target.setDate(today.getDate() - dayNr + 3);

  // ISO 8601 states that week 1 is the week
  // with january 4th in it
  var jan4 = new Date(target.getFullYear(), 0, 4);

  // Number of days between target date and january 4th
  var dayDiff = (target - jan4) / 86400000;

  // Calculate week number: Week 1 (january 4th) plus the
  // number of weeks between target date and january 4th
  var weekNr = Math.ceil(dayDiff / 7);

  function preZero (num) {
    return num <= 9 ? '0'+num : num;
  }

  return {
    calendarWeek: weekNr,
    year: today.getYear(),
    startDate: monday.getFullYear()+'-'+preZero(monday.getMonth()+1)+'-'+preZero(monday.getDate()),
    endDate: sunday.getFullYear()+'-'+preZero(sunday.getMonth()+1)+'-'+preZero(sunday.getDate())
  };
}


function getBasicData (request, reply) {
  var currentWeek = getDates();

  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': ALL_DATA_VIEW_ID,
      'start-date': currentWeek.startDate,
      'end-date': currentWeek.endDate,
      'metrics': 'ga:pageviews,ga:users,ga:avgTimeOnPage,ga:bounceRate'
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      var weekData = result.rows[0];

      currentWeek.views = weekData[0];
      currentWeek.users = weekData[1];
      currentWeek.avgTime = weekData[2];
      currentWeek.bounceRate = weekData[3];

      Week.findOneAndUpdate({calendarWeek: currentWeek.calendarWeek}, currentWeek, {upsert: true}, function (err) {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err));
        }
        reply(result.rows.length + ' week created / updated.');
      });
    });
  });
}


function getSharesData (request, reply) {
  var currentWeek = getDates();

  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': ALL_DATA_VIEW_ID,
      'start-date': currentWeek.startDate,
      'end-date': currentWeek.endDate,
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

          Week.findOneAndUpdate({name: model.name}, model, {upsert: true}, function (err) {
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
  var currentWeek = getDates();

  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': ALL_DATA_VIEW_ID,
      'start-date': currentWeek.startDate,
      'end-date': currentWeek.endDate,
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

          Week.findOneAndUpdate({name: collection.name}, collection, {upsert: true}, function (err) {
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
  var currentWeek = getDates();

  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': ALL_DATA_VIEW_ID,
      'start-date': currentWeek.startDate,
      'end-date': currentWeek.endDate,
      'metrics': 'ga:users',
      'dimensions': 'ga:country,ga:pagePath',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
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

          Week.findOneAndUpdate({name: model.name}, model, {upsert: true}, function (err) {
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
      path: '/ga/weeks',
      config: {
        handler: getBasicData,
        auth: 'session'
      }
    },
    {
      method: 'GET',
      path: '/ga/weeks_shares',
      config: {
        handler: getSharesData,
        auth: 'session'
      }
    },
    {
      method: 'GET',
      path: '/ga/weeks_events',
      config: {
        handler: getEventsData,
        auth: 'session'
      }
    },
    {
      method: 'GET',
      path: '/ga/weeks_popular',
      config: {
        handler: getMostPopularCollection,
        auth: 'session'
      }
    }
  ]
  .forEach(function (route) { server.route(route); });
};
