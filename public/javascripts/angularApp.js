var app = angular.module('polls', ["ngRoute"]);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  
  $routeProvider
    .when('/', { templateUrl: 'templates/list.ejs', controller: 'ListCtrl' })
    .when('/poll/:id',{ templateUrl: 'templates/item.ejs', controller: 'ItemCtrl'})
    .when('/new',{ templateUrl: 'templates/new.ejs', controller: 'NewPollCtrl' });
    
  $routeProvider.otherwise({ redirectTo: "/" });
  $locationProvider.html5Mode({ enabled: true, requireBase: false});
}]);

app.factory('socket',['$rootScope', function($rootScope) {
  var socket = io.connect('0.0.0.0:3000');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
}]);

app.controller('ListCtrl', ['$scope','$http', function($scope, $http){
  
  $http.get('/polls').then(function(response){
    $scope.polls = response.data;
  });
}]);

app.controller('ItemCtrl', ['$scope', '$routeParams', '$http', 'socket', function($scope, $routeParams, $http, socket){
  
  $http.get('/polls/' + $routeParams.id).then(function(response){
    $scope.poll = response.data;
  });  
                           
    socket.on('myvote', function(data) {
        console.dir(data);
        if(data._id === $routeParams.pollId) {
              $scope.poll = data;
            }
        });
    socket.on('vote', function(data) {
        console.dir(data);
        if(data._id === $routeParams.pollId) {
              $scope.poll.choices = data.choices;
              $scope.poll.totalVotes = data.totalVotes;
            }   
        });
    $scope.vote = function() {
        var pollId = $scope.poll._id;
        var choiceId = $scope.poll.userVote;
        if(choiceId) {
            var voteObj = { poll_id: pollId, choice: choiceId };
            socket.emit('send:vote', voteObj);
        } else {
            alert('You must select an option to vote for');
        }
    };
}]);

app.controller('NewPollCtrl', ['$scope','$http','$location', function($scope, $http, $location){
  
    $scope.poll = {question: '', choices: [{ text: '' }, { text: '' }, { text: '' }] };
    
    $scope.addChoice = function() {
      $scope.poll.choices.push({ text: '' });
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