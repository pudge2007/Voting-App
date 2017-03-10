var async = require('async');
var Poll = require('../models/Polls');
var User = require('../models/Users');

module.exports = function (app, passport) {
    
  var isLoggedIn = function (req, res, next) {
  	if (!req.isAuthenticated())
  	  res.send(401);
  	else
      next();		
  }
  
  // API-интерфейс JSON для списка опросов
  app.get('/polls', function(req, res) {
    Poll.find({}, 'question', function(error, polls) {
      res.json(polls);
    });
  });
  
  //  API-интерфейс JSON для создания нового опроса
  app.post('/polls', isLoggedIn, function(req, res) {
    var reqBody = req.body,
        choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
        pollObj = {question: reqBody.question, choices: choices, userId: req.user.github.id};
    var poll = new Poll(pollObj);
    poll.save(function(err, doc) {
      if(err || !doc) {
        throw 'Error';
      } else {
        res.json(doc);
      }   
    });
  });
  
  // API-интерфейс JSON для получения отдельного опроса
  app.get('/polls/:id', function(req, res) {
    var pollId = req.params.id;
    Poll.findById(pollId, '', { lean: true }, function(err, poll) {
      if (err) throw err;
      if(poll) {
        var userVoted = false,
            userChoice,
            totalVotes = 0;
        for(var c in poll.choices) {
          var choice = poll.choices[c]; 
          for(var v in choice.votes) {
            var vote = choice.votes[v];
            totalVotes++;
            if(vote.ip === (req.header('x-forwarded-for') || req.ip)) {
              userVoted = true;
              userChoice = { _id: choice._id, text: choice.text };
            }
          }
        }
        poll.userVoted = userVoted;
        poll.userChoice = userChoice;
        poll.totalVotes = totalVotes;
        res.json(poll);
      } else {
        res.json({error:true});
      }
    });
  });
  
  // API для удаления опроса
  app.delete('/polls/:pollId', function(req, res){
    Poll.remove({ _id: req.params.pollId}, function(err){
      if(err) throw err;
      res.send(200);
    })
  });
  
  // initiate authentication with GitHub 
  app.get('/auth/github', passport.authenticate('github'));

  // called after GitHub authentication
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) { 
      res.redirect('/profile'); 
    });

  // logout
	app.get('/logout', isLoggedIn, function (req, res) { 
	  req.logout();
	  res.redirect('/login'); 
	});
	
	// API для проверки на аутентификацию
  app.get('/loggedin', function(req, res) {
    res.send(req.isAuthenticated() ? req.user.github.id : '0');
  });
	
	 // API-интерфейс JSON для профиля
  app.get('/user', function(req, res, next) {
    async.parallel({
      name: function(callback){
        return User.findOne({'github.id': req.user.github.id}).select({ 'github.displayName': 1, _id: 0}).exec(callback);
      },
      userPolls: function(callback){
        return Poll.find({'userId': req.user.github.id}).select({ 'question': 1, _id: 1}).exec(callback);
      }  
      }, function(err, results){
        if (err) throw err;
        res.json(results);
    });
  });
  
};
