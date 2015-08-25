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

  vm.calcBgd = function (field, index) {
    if (index === 0) { return 'background: transparent;'; }

    var currentValue = vm.weeks[index][field],
        previousValue = vm.weeks[index-1][field];

    if (currentValue > previousValue) {
      return 'background: rgba(71, 146, 71, 0.53);';
    }
    if (currentValue < previousValue) {
      return 'background: rgba(255, 0, 0, 0.37);';
    }
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
