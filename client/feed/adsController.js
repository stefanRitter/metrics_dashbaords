angular.module('app').controller('adsController', ['$http', function ($http) {
  'use strict';

  var vm = this;
  vm.ads = [];
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

  $http
    .get('/ads', {})
    .error(function (err) {
      console.log('error', err);
    })
    .success(function (result) {
      console.log(result);
      vm.ads = result;
    });

}]);
