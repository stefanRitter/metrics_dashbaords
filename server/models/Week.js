'use strict';

var mongoose = require('mongoose'),
    schema;

schema = mongoose.Schema({
  year: {type: Number, default: 2015},
  calendarWeek: {
    type: Number,
    index: true,
    unique: true
  },
  startDate: {
    type: String,
    index: true,
    unique: true
  },
  endDate:  {
    type: String,
    index: true,
    unique: true
  },

  views: {type: Number, default: 0},
  users: {type: Number, default: 0},
  avgTime: {type: Number, default: 0},
  bounceRate: {type: Number, default: 0},

  showMoreClicks: {type: Number, default: 0},
  externalClicks: {type: Number, default: 0},
  otherNavigationClicks: {type: Number, default: 0},
  comments: {type: Number, default: 0},
  upvotes: {type: Number, default: 0},
  bookmarks: {type: Number, default: 0},

  twitterShares: {type: Number, default: 0},
  facebookShares: {type: Number, default: 0},
  sharelineShares: {type: Number, default: 0},

  collection1: {type: String, default: ''},
  collection2: {type: String, default: ''},
  collection3: {type: String, default: ''}
});

module.exports = mongoose.model('Week', schema);
