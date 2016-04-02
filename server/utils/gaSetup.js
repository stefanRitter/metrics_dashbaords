'use strict';

var Path = require('path'),
    pemPath = Path.join(__dirname, '../config');

var googleapis = require('googleapis'),
    JWT = googleapis.auth.JWT;

var SERVICE_ACCOUNT_EMAIL = '431222840368-vm8ghahfqkclispahsacsdv3l89se6ob@developer.gserviceaccount.com';
var SERVICE_ACCOUNT_KEY_FILE = pemPath + '/key.pem';

var COLLECTIONS_VIEW_ID = 'ga:106745667';
var ALL_DATA_VIEW_ID = 'ga:106585530';
var LOGGEDIN_VIEW_ID = 'ga:106761745';

var START_DATE = '2016-03-01';
var END_DATE = '2016-04-30';

var authClient = new JWT(
    SERVICE_ACCOUNT_EMAIL,
    SERVICE_ACCOUNT_KEY_FILE,
    null,
    ['https://www.googleapis.com/auth/analytics.readonly']
);


module.exports = {
  START_DATE: START_DATE,
  END_DATE: END_DATE,
  COLLECTIONS_VIEW_ID: COLLECTIONS_VIEW_ID,
  ALL_DATA_VIEW_ID: ALL_DATA_VIEW_ID,
  LOGGEDIN_VIEW_ID: LOGGEDIN_VIEW_ID,
  authClient: authClient
};
