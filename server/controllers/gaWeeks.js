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


function getDates (date) {
  var today  = !!date ? new Date(date) : new Date();
  var dayNr = (today.getDay() + 6) % 7;
  var monday = new Date(today.setDate(today.getDate() - dayNr));
  var sunday = new Date(today.setDate(monday.getDate() + 6));

  console.log(monday.getDate(), sunday.getDate());

  function preZero (num) {
    return num <= 9 ? '0'+num : num;
  }

  function getWeek () {
    var onejan = new Date(monday.getFullYear(), 0, 1);
    return Math.ceil((((monday - onejan) / 86400000) + onejan.getDay() + 1) / 7)-1;
  }

  return {
    calendarWeek: getWeek(),
    year: monday.getYear(),
    startDate: monday.getFullYear()+'-'+preZero(monday.getMonth()+1)+'-'+preZero(monday.getDate()),
    endDate: sunday.getFullYear()+'-'+preZero(sunday.getMonth()+1)+'-'+preZero(sunday.getDate())
  };
}


function getBasicData (request, reply, date) {
  var currentWeek = getDates(date);
  console.log(currentWeek);

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


function getSharesData (request, reply, date) {
  var currentWeek = getDates(date);

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
          case 'linkedin':
            currentWeek.linkedinShares = row[1];
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


function getEventsData (request, reply, date) {
  var currentWeek = getDates(date);
  console.log('currentweek', currentWeek);

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
          case 'mediawallclick':
            currentWeek.mediaWallClick = row[1];
            break;
          case 'mediawallscroll':
            currentWeek.mediaWallScroll = row[1];
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

function getMostPopularCollection (request, reply, date) {
  var currentWeek = getDates(date);

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
      'metrics': 'ga:pageviews',
      'dimensions': 'ga:pagePath',
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
        // if no collection create one
        var cleanTitle = row[0].split('?')[0];
        if (!matrix[cleanTitle]) { matrix[cleanTitle] = 0; }
        matrix[cleanTitle] += parseInt(row[1],10);
      });

      var sorted = [];
      Object.keys(matrix).forEach(function (title) {
        sorted.push([title, matrix[title]]);
      });

      sorted = result.rows.sort(function (a, b) {
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

function getLoggedInData (request, reply, date) {
  var currentWeek = getDates(date);

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

        doc.loggedoutUsers = doc.users - currentWeek.loggedinUsers;
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


function getBannerClicks (request, reply, date) {
  var currentWeek = getDates(date);
  console.log('currentweek', currentWeek);

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
      'metrics': 'ga:totalEvents',
      'dimensions': 'ga:eventCategory,ga:eventAction',
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
          case 'banner':
            if (row[1] === 'top') {
              currentWeek.bannerTopClicks = row[2];
            } else {
              currentWeek.bannerBottomClicks = row[2];
            }
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
    },
    {
      method: 'GET',
      path: '/ga/weeks_bannerclicks',
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
    }
  ]
  .forEach(function (route) { server.route(route); });
};
