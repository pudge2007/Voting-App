var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Poll = mongoose.model('Poll');

// GET home page. 
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// API-интерфейс JSON для списка опросов
router.get('/polls', function(req, res, next) {
  Poll.find({}, 'question', function(error, polls) {
    res.json(polls);
  });
});

//  API-интерфейс JSON для создания нового опроса
router.post('/polls', function(req, res, next) {
  var reqBody = req.body,
      choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
      pollObj = {question: reqBody.question, choices: choices};
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
router.get('/polls/:id', function(req, res, next) {
  console.log(req.params.id)
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


module.exports = router;

