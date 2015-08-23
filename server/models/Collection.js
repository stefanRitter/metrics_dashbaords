'use strict';

var mongoose = require('mongoose'),
    schema;

schema = mongoose.Schema({
  title: String,

  url: {
    type: String,
    index: true,
    unique: true
  },

  views: {type: Number, default: 0},
  avgTime: {type: Number, default: 0},

  showMoreClicks: {type: Number, default: 0},
  externalClicks: {type: Number, default: 0},
  otherNavigationClicks: {type: Number, default: 0},
  comments: {type: Number, default: 0},
  upvotes: {type: Number, default: 0},
  bookmarks: {type: Number, default: 0},

  twitterShares: {type: Number, default: 0},
  facebookShares: {type: Number, default: 0},
  sharelineShares: {type: Number, default: 0}
});

module.exports = mongoose.model('Collection', schema);
