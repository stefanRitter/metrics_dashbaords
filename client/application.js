angular.module('app', [
  'ngAnimate',
  'ngCookies',
  'ngResource',
  'ngRoute',
  'ngSanitize',
  'ngTouch',
  'angular-loading-bar',
]);

angular.module('app').config(function ($routeProvider, $locationProvider) {
  'use strict';

  $locationProvider.html5Mode(true);

  $routeProvider
    .when('/',            {templateUrl: '/assets/html/auth/login'})
    .when('/login',       {templateUrl: '/assets/html/auth/login'})
    .when('/join',        {templateUrl: '/assets/html/auth/join'})
    .when('/collections', {templateUrl: '/assets/html/feed/collections'})
    .when('/countries',   {templateUrl: '/assets/html/feed/countries'})
    .when('/weeks',       {templateUrl: '/assets/html/feed/weeks'})

    .otherwise({redirectTo: '/'});
});


angular.module('app').run(['$rootScope', '$location', 'currentUser', function ($rootScope, $location) {
  'use strict';

  $rootScope.$on('$routeChangeSuccess', function () {
    //window.ga('send', 'pageview', $location.path());
  });
}]);
