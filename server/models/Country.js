'use strict';

var mongoose = require('mongoose'),
    schema;

schema = mongoose.Schema({
  name: {
    type: String,
    index: true,
    unique: true
  },

  views: {type: Number, default: 0},
  users: {type: Number, default: 0},
  avgTime: {type: Number, default: 0},
  bounceRate: {type: Number, default: 0},

  bannerClicks: {type: Number, default: 0},
  bannerTopClicks: {type: Number, default: 0},
  bannerBottomClicks: {type: Number, default: 0},

  showMoreClicks: {type: Number, default: 0},
  externalClicks: {type: Number, default: 0},
  otherNavigationClicks: {type: Number, default: 0},

  comments: {type: Number, default: 0},
  upvotes: {type: Number, default: 0},
  bookmarks: {type: Number, default: 0},

  twitterShares: {type: Number, default: 0},
  facebookShares: {type: Number, default: 0},
  linkedinShares: {type: Number, default: 0},
  sharelineShares: {type: Number, default: 0},

  twitterfeedScroll: {type: Number, default: 0},
  twitterfeedClick: {type: Number, default: 0},
  twitterfeed: {type: Number, default: 0},

  collection1: {type: String, default: ''},
  collection2: {type: String, default: ''},
  collection3: {type: String, default: ''},

  register: {type: Number, default: 0},
  placeholder: {type: Number, default: 0},
  emailus: {type: Number, default: 0},
});

module.exports = mongoose.model('Country', schema);
