angular.module('app').controller('gaController', ['$http', function ($http) {
  'use strict';

  var vm = this;
  vm.message = 'select update process:';

  vm.updateProcess = function (url) {
    $http
      .get(url, {})
      .error(function (err) {
        console.log('error', err);
        vm.message = err.message;
      })
      .success(function (result) {
        vm.message = result;
      });
  };
}]);
