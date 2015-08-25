'use strict';

var server = {};

var Boom = require('boom');

var Week = require('mongoose').model('Week');

var googleapis = require('googleapis'),
    analytics = googleapis.analytics('v3');

var gaSetup = require('../utils/gaSetup');

var ALL_DATA_VIEW_ID = gaSetup.ALL_DATA_VIEW_ID;
var COLLECTIONS_VIEW_ID = gaSetup.COLLECTIONS_VIEW_ID;
var LOGGEDIN_VIEW_ID = gaSetup.LOGGEDIN_VIEW_ID;
var authClient = gaSetup.authClient;


function getDates () {
  var today  = new Date(),
      target = new Date();

  // ISO week date weeks start on monday
  // so correct the day number
  var dayNr = (today.getDay() + 6) % 7;

  var monday = new Date(today.setDate(today.getDate() - dayNr));
  var sunday = new Date(today.setDate(today.getDate() - dayNr + 8));

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
      'metrics': 'ga:pageviews,ga:users,ga:avgTimeOnPage,ga:bounceRate,ga:newUsers,ga:pageviewsPerSession,ga:sessions'
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      if (result.totalResults === 0) {
        return reply('No data this week...');
      }

      var row = result.rows[0];

      currentWeek.views = row[0];
      currentWeek.users = row[1];
      currentWeek.avgTime = row[2];
      currentWeek.bounceRate = Math.round(row[3]);
      currentWeek.newUsers = row[4];
      currentWeek.pageviewsPerSession = row[5];
      currentWeek.sessions = row[6];
      currentWeek.returningUsers = currentWeek.users - currentWeek.newUsers;

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

      result.rows.forEach(function (row) {
        switch (row[0]) {
          case 'tweet':
            currentWeek.twitterShares = row[1];
            break;
          case 'share':
            currentWeek.facebookShares = row[1];
            break;
          case 'shareline':
            currentWeek.sharelineShares = row[1];
            break;
        }
      });

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

      result.rows.forEach(function (row) {
        switch (row[0]) {
          case 'show more':
            currentWeek.showMoreClicks = row[1];
            break;
          case 'external link':
            currentWeek.externalClicks = row[1];
            break;
          case 'other navigation':
            currentWeek.otherNavigationClicks = row[1];
            break;
          case 'comment':
            currentWeek.comments = row[1];
            break;
          case 'upvote':
            currentWeek.upvotes = row[1];
            break;
          case 'bookmark':
            currentWeek.bookmarks = row[1];
            break;
          case 'email':
            currentWeek.newEmails = row[1];
            break;
        }
      });

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
      'ids': COLLECTIONS_VIEW_ID,
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

function getLoggedInData (request, reply) {
  var currentWeek = getDates();

  authClient.authorize(function (err) {
    if (err) {
      console.log('AUTH ERROR: ', err);
      return reply(Boom.badImplementation(err));
    }

    analytics.data.ga.get({
      auth: authClient,
      'ids': LOGGEDIN_VIEW_ID,
      'start-date': currentWeek.startDate,
      'end-date': currentWeek.endDate,
      'metrics': 'ga:users',
    }, function (err, result) {

      if (err) {
        console.error('DATA ERROR', err);
        return reply(Boom.badImplementation(err));
      }

      if (result.totalResults === 0) {
        return reply('No data this week...');
      }

      currentWeek.loggedinUsers = result.rows[0][0];

      Week.findOneAndUpdate({calendarWeek: currentWeek.calendarWeek}, currentWeek, {upsert: true}, function (err, doc) {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err));
        }

        doc.loggedoutUsers = doc.users - doc.loggedinUsers;
        doc.save(function (err) {
          if (err) {
            console.error(err);
            return reply(Boom.badImplementation(err));
          }
          reply(result.rows[0][0] + ' users logged in.');
        });
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
    },
    {
      method: 'GET',
      path: '/ga/weeks_login',
      config: {
        handler: getLoggedInData,
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
