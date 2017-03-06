var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	github: {
	    id: String,
		displayName: String,
		username: String
	},
    polls: {
        id: String
    }
});

module.exports = mongoose.model('User', UserSchema);
