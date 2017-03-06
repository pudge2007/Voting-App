var passport = require('passport');
var Poll = require('../models/Polls');

/*function isLoggedIn (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		res.redirect('/new');
	}
}

router.get('/profile', isLoggedIn, function(req, res, next) {
  console.log('ok')
});*/


// API-интерфейс JSON для списка опросов
exports.allPolls = function(req, res) {
  Poll.find({}, 'question', function(error, polls) {
    res.json(polls);
  });
};

//  API-интерфейс JSON для создания нового опроса
exports.createPoll = function(req, res) {
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
};

// API-интерфейс JSON для получения отдельного опроса
exports.singlePoll = function(req, res) {
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
};