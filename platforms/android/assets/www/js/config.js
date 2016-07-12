angular.module('app.config', [])

.constant('APP_PARAMS', {
    type: 2
})

.constant('PAGUS_API_ENDPOINT', {
    url: 'http://192.168.0.36:8080/pagusss'
    //url : '/pagusss'
})

.constant('PAGUS_DB_CONFIG', {
    name: 'pagus_db',
    tables: [
      {
          name: 'user',
          columns: [
              { name: 'id', type: 'integer primary key' },
              { name: 'name', type: 'text' },
              { name: 'msisdn', type: 'text'},
              { name: 'skey', type: 'text' },
              { name: 'type', type: 'integer' }
          ]
      }
    ]
})

//Setings for HTTP security and headers
.config(function ($httpProvider) {
    $httpProvider.defaults.useXDomain = false;
    $httpProvider.defaults.withCredentials = false;
    $httpProvider.defaults.useXDomain = true;
    //$httpProvider.defaults.withCredentials = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $httpProvider.defaults.headers.post = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' };
    $httpProvider.defaults.headers.put = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' };
    
});