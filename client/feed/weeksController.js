angular.module('app').controller('weeksController', ['$http', function ($http) {
  'use strict';

  var vm = this;
  vm.weeks = [];
  vm.orderFilter = 'calendarWeek';
  vm.orderFilterDirection = false;

  vm.changeFilter = function (filter) {
    if (vm.orderFilter === filter) {
      vm.orderFilterDirection = !vm.orderFilterDirection;
    } else {
      vm.orderFilter = filter;
      vm.orderFilterDirection = true;
    }
  };

  vm.formatCollectionPath = function (path) {
    return path ? path.split('/')[5].replace(/-/g,' ') : '';
  };

  $http
    .get('/weeks', {})
    .error(function (err) {
      console.log('error', err);
    })
    .success(function (result) {
      vm.weeks = result;
    });

}]);
