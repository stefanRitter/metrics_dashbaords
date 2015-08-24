'use strict';

var Boom = require('boom'),
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

      if (result.totalResults === 0) {
        return reply('No data this week...');
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
      'dimensions': 'ga:socialInteractionAction',
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
        return reply('No share actions this week...');
      }

      var weekData = result.rows[0];

      switch (weekData[0]) {
        case 'tweet':
          currentWeek.twitterShares = weekData[1];
          break;
        case 'share':
          currentWeek.facebookShares = weekData[1];
          break;
        case 'shareline':
          currentWeek.sharelineShares = weekData[1];
          break;
      }

      Week.findOneAndUpdate({calendarWeek: currentWeek.calendarWeek}, currentWeek, {upsert: true}, function (err) {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err));
        }
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

      var weekData = result.rows[0];

      switch (weekData[0]) {
        case 'show more':
          currentWeek.showMoreClicks = weekData[1];
          break;
        case 'external link':
          currentWeek.externalClicks = weekData[1];
          break;
        case 'other navigation':
          currentWeek.otherNavigationClicks = weekData[1];
          break;
        case 'comment':
          currentWeek.comments = weekData[1];
          break;
        case 'upvote':
          currentWeek.upvotes = weekData[1];
          break;
        case 'bookmark':
          currentWeek.bookmarks = weekData[1];
          break;
      }

      Week.findOneAndUpdate({calendarWeek: currentWeek.calendarWeek}, currentWeek, {upsert: true}, function (err) {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err));
        }
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
      'dimensions': 'ga:pagePath',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      if (result.totalResults === 0) {
        return reply('No collections this week...');
      }

      var sorted = result.rows.sort(function (a, b) {
        return b[1] - a[1];
      });

      currentWeek.collection1 = sorted[0][0];
      currentWeek.collection2 = sorted[1] ? sorted[1][0] : '';
      currentWeek.collection3 = sorted[2] ? sorted[2][0] : '';

      Week.findOneAndUpdate({calendarWeek: currentWeek.calendarWeek}, currentWeek, {upsert: true}, function (err) {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err));
        }
        reply(result.rows.length + ' collections processed.');
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
      path: '/ga/weeks_shares',
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
      path: '/ga/weeks_events',
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
      path: '/ga/weeks_popular',
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
