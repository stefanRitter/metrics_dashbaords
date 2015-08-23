angular.module('app').controller('collectionsController', ['$http', function ($http) {
  'use strict';

  var vm = this;
  vm.collections = [];
  vm.orderFilter = 'views';
  vm.orderFilterDirection = true;

  vm.changeFilter = function (filter) {
    if (vm.orderFilter === filter) {
      vm.orderFilterDirection = !vm.orderFilterDirection;
    } else {
      vm.orderFilter = filter;
      vm.orderFilterDirection = true;
    }
  };

  $http
    .get('/collections', {})
    .error(function (err) {
      console.log('error', err);
    })
    .success(function (result) {
      vm.collections = result;
    });

}]);
