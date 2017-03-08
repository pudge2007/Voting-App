var app = angular.module('polls', ['ngResource', 'ngRoute', 'chart.js']);

app.factory('loggedInterceptor', ['$rootScope', '$q', '$location', function($rootScope, $q, $location) {
  return { 
    responseError: function(response) { 
      if (response.status === 401){
        $location.url('/login');
        return $q.reject(response);
      }
      else
        return $q.reject(response); 
    } 
  };
}]);

app.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
  var checkLoggedin = function($q, $timeout, $http, $location, $rootScope){
    var deferred = $q.defer();
    $http.get('/loggedin').then(function(response){
      if (response.data !== '0') {
        deferred.resolve();
        $rootScope.showDetails = true
        $rootScope.userId = response.data;
      }
      else { 
        deferred.reject();
        $rootScope.showDetails = false
        $location.url('/login');
      } 
    }); 
    return deferred.promise; 
  };
  $routeProvider
    .when('/', { templateUrl: 'partials/home.ejs', controller: 'ListCtrl' })
    .when('/poll/:id',{ templateUrl: 'partials/poll.ejs', controller: 'ItemCtrl' })
    .when('/new',{ templateUrl: 'partials/new.ejs', controller: 'NewPollCtrl', resolve: { loggedin: checkLoggedin }})
    .when('/profile',{ templateUrl: 'partials/profile.ejs', controller: 'UserCtrl', resolve: { loggedin: checkLoggedin } })
    .when('/login',{ templateUrl: 'partials/login.ejs' });
    
  $routeProvider.otherwise({ redirectTo: "/" });
  $locationProvider.html5Mode({ enabled: true, requireBase: false});
  $httpProvider.interceptors.push('loggedInterceptor');
}]);

  
app.controller('MainCtrl', ['$scope','$http', '$location', function($scope, $http, $location){

}]);

//all polls to index page
app.controller('ListCtrl', ['$scope','$http', function($scope, $http){
  
  $http.get('/polls').then(function(response){
    $scope.polls = response.data;
  });
}]);

//single poll
app.controller('ItemCtrl', ['$scope', '$route', '$routeParams', '$http', function($scope, $route, $routeParams, $http){
  
  function chart (poll){
    var labels = [];
    var votes = poll.choices.map(function(choice){
      labels.push(choice.text);
      return choice.votes.length;
    })
    $scope.labels = labels;
    $scope.votes = votes;
  }
  
  $http.get('/polls/' + $routeParams.id).then(function(response){
    $scope.poll = response.data;
    chart ($scope.poll);
  });  
  
  var socket = io.connect();                         
  socket.on('myvote', function(data) {
    if(data._id === $routeParams.pollId) {
        $scope.poll = data;
        chart ($scope.poll)
    }
  });
  socket.on('vote', function(data) {
    if(data._id === $routeParams.pollId) {
        $scope.poll.choices = data.choices;
        $scope.poll.totalVotes = data.totalVotes;
        chart (data)
      }   
  });
  
  $scope.vote = function() {
    var pollId = $scope.poll._id;
    var choiceId = $scope.poll.userVote;
    if(choiceId) {
      var voteObj = { poll_id: pollId, choice: choiceId };
      socket.emit('send:vote', voteObj);
      $route.reload();
    } else {
      alert('You must select an option to vote for');
    }
  };
}]);

//create new poll
app.controller('NewPollCtrl', ['$scope', '$http', '$location', function($scope, $http, $location){
  
    $scope.poll = {question: '', choices: [{ text: '' }, { text: '' }] };
    
    $scope.addChoice = function() {
      if($scope.poll.choices.length < 7)
        $scope.poll.choices.push({ text: '' });
      else alert ('Choices an be no more than 7')
    };
          
    $scope.createPoll = function() {
      var poll = $scope.poll;
      if(poll.question.length > 0) {
        var choiceCount = 0;
        for(var i = 0, ln = poll.choices.length; i < ln; i++) {
          var choice = poll.choices[i];        
          if(choice.text.length > 0) {
            choiceCount++;
          }
        }    
        if(choiceCount > 1) {
          $http.post('/polls', poll).then(function(response){
              $location.path('/'); 
          });
        } else {
          alert('You must enter at least two choices');
        }
      } else {
        alert('You must enter a question');
      }
    };
}]);

//profile controller
app.controller('UserCtrl', ['$scope', '$route', '$http', function($scope, $route, $http){
  $http.get('/user').then(function(response){
    $scope.username = response.data.name.github.displayName;
    $scope.userPolls = response.data.userPolls;
  })
  
  $scope.deletePoll = function(id){
    $http.delete('/polls/' + id).then(function(){
      console.log('deleted')
    })
    $route.reload();
  }
}]);