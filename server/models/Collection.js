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

  views: Number,
  avgTime: Number,

  showMoreClicks: Number,
  cxternalClicks: Number,
  otherNavigationClicks: Number,
  comments: Number,
  upvotes: Number,
  bookmarks: Number,

  twitterShares: Number,
  facebookShares: Number,
  sharelineShares: Number
});

module.exports = mongoose.model('Collection', schema);
