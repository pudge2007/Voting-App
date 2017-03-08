var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	github: {
	    id: String,
		displayName: String,
		username: String
	}
});

module.exports = mongoose.model('User', UserSchema);
