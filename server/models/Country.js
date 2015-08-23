'use strict';

var mongoose = require('mongoose'),
    schema;

schema = mongoose.Schema({
  name: String,

  views: Number,
  avgTime: String,

  showMoreClicks: Number,
  cxternalClicks: Number,
  comments: Number,
  upvotes: Number,
  bookmarks: Number,
  otherNavigationClicks: Number,

  twitterShares: Number,
  facebookShares: Number,
  sharelineShares: Number
});

module.exports = mongoose.model('Country', schema);
