var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");



var UserSchema = mongoose.Schema({
	username : {
		type : String,
	},
	password : {
		type : String
	}
});

var User = module.exports = mongoose.model("User",UserSchema);

module.exports.createUser = function(newUser,callback){
	bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(err, hash) {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback); 
    	});
	});
}

module.exports.getUserByUsername = function(username,callback){
	var query = {username: username};
	User.findOne(query,callback);
}

module.exports.comparePassword = function(logpassword,hash,callback){
	bcrypt.compare(logpassword,hash,function(err,match){
		if(err)  throw err;
		callback(null,match);
	})
}

module.exports.getUserById = function(id,callback){
	User.findById(id,callback);
}