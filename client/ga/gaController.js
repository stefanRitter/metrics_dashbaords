angular.module('app').controller('gaController', ['$http', function ($http) {
  'use strict';

  var vm = this;

  $http
    .get('/weeks', {})
    .error(function (err) {
      console.log('error', err);
    })
    .success(function (result) {
      vm.weeks = result;
    });


}]);
