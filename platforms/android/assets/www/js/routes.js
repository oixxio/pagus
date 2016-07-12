angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    
  .state('home', {
      url: '/home',
      templateUrl: 'templates/home.html',
      controller: 'homeCtrl'
  })

  .state('newVendor', {
    url: '/newVendor',
    templateUrl: 'templates/newVendor.html',
    controller: 'newVendorCtrl'
  })

  .state('menu', {
    url: '/menu',
    templateUrl: 'templates/menu.html',
    controller: 'menuCtrl'
  })

  .state('createOrder', {
    url: '/newOrder',
    templateUrl: 'templates/createOrder.html',
    controller: 'createOrderCtrl'
  })

  .state('cancelOrder', {
    url: '/cancelOrder',
    templateUrl: 'templates/cancelOrder.html',
    controller: 'cancelOrderCtrl'
  })

  .state('queryOrder', {
    url: '/queryOrder',
    templateUrl: 'templates/queryOrder.html',
    controller: 'queryOrderCtrl'
  })
    
  $urlRouterProvider.otherwise('/home')

  

});