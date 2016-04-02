'use strict';

var mongoose = require('mongoose'),
    schema;

schema = mongoose.Schema({

  myId: {type: Number, default: 10},

  views: {type: Number, default: 0},

  bannerClicksHomepage: {type: Number, default: 0},
  bannerClicksCollections: {type: Number, default: 0},
  bottomBannerClicks: {type: Number, default: 0},
  assetPagesBannerClicks: {type: Number, default: 0},

});

module.exports = mongoose.model('Ad', schema);
