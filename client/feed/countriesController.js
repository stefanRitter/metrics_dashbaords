angular.module('app').controller('countriesController', ['$http', function ($http) {
  'use strict';

  var vm = this;
  vm.countries = [];
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

  vm.formatCollectionPath = function (path) {
    if (!path) { return ''; }

    var splitted = path.split('/');
    return splitted[splitted.length-1].replace(/-/g,' ');
  };

  $http
    .get('/countries', {})
    .error(function (err) {
      console.log('error', err);
    })
    .success(function (result) {
      vm.countries = result;
    });

}]);
