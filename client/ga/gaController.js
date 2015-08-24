angular.module('app').controller('gaController', ['$http', function ($http) {
  'use strict';

  var vm = this;
  vm.message = 'select update process:';

  vm.updateProcess = function (url) {
    $http
      .get(url, {})
      .error(function (err) {
        window.alert('error');
        console.log('error', err);
      })
      .success(function (result) {
        vm.message = result;
      });
  };
}]);
