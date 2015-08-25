angular.module('app').factory('currentUser', ['$location', '$http', '$rootScope', function ($location, $http, $rootScope) {
  'use strict';

  var currentUser,
      previousPath;

  function login (user) {
    currentUser = user;
    $rootScope.$emit('userLoggedIn');
    $location.path(previousPath);
  }

  $http
    .get('/session', {})
    .error(function () {
      console.log('user not authenticated');
      previousPath = $location.path();
      if (previousPath === '/' || previousPath === '/login') {
        previousPath = '/collections';
      }
      $location.path('/login');
    })
    .success(login);

  return {
    get: function () {
      return currentUser;
    },
    login: login
  };
}]);
