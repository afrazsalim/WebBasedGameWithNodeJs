// Load required packages
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const _ = require("lodash");

// Initializing
mongoose.set("useCreateIndex", true);


var UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: [true, "Username is required"],
		minlength: [4, "Your username must be at least 4 characters long"],
		unique: [true, "That username is already in use"]
	},
	password: {
		type: String,
		minlength: [4, "Your password must be at least 4 characters long"],
		required: [true, "Password is required"]
	},
	room:{
		type : String
	},
	tokens: [{
		access: {
			type: String,
			required: true
		},
		token: {
			type: String,
			required: true
		}
	}],
	pictures: []
});


UserSchema.methods.toJSON = function() {
	var user = this;
	var userObject = user.toObject();

	return _.pick(userObject, ["_id", "username"]);
};


UserSchema.statics.findByToken = function(token) {
	var User = this;
	var decoded;
	return User.findOne({
		"tokens.token": token
	});
	try {
		decoded = jwt.verify(token,"abc123");
	} catch(e) {
		return new Promise((resolve, reject) => {
			reject();
		});
	}
};


UserSchema.pre("save", function(next) {
	var user = this;
	if (user.isModified("password")) {
		bcrypt.genSalt(1, (err, saltvalue) => {
			bcrypt.hash(user.password, saltvalue, (err, hash) => {
				user.password = hash;
				next();
			});
		});
	} else {
		next();
	}
});


UserSchema.statics.findByData = function(username, password) {
	var errorObject = {"recipient": null, "message": "The given username-password combination is wrong."};
	var User = this;
	return User.findOne({username}).then((user) => {
		if (!user) {
			return Promise.reject(errorObject);
		}

		return new Promise((resolve, reject) => {
			bcrypt.compare(password, user.password, (err, res) => {
				if (res) {
					resolve(user);
				} else {
					reject(errorObject);
				}
			});
		});
	});
};


UserSchema.methods.removeToken = function(token) {
	var user = this;
	user.tokens = [];

	return user.save().then(() => {
		return token;
	});
};


UserSchema.methods.generateAuthToken = function() {
	var user = this;
	var access = "auth";
	var token = jwt.sign({_id: user._id.toHexString, access}, "abc123").toString();

	user.tokens = user.tokens.concat({access, token});
	return user.save().then(() => {
		return token;
	});
};


UserSchema.methods.addRoomNumber = function(roomName) {
	var user = this;
	user.room = roomName;
	return user.save().then(() => {
		return user.room;
	});
};

UserSchema.methods.savePicture = function(pictureData) {
	var user = this;
	var list = [];

	list = user.pictures;
	list.push(pictureData);
	user.pictures = list;

	return user.save().then(() => {
		return user;
	});
};


UserSchema.methods.featureVector = function(name) {
	var user = this;

	for (var i = 0; i < user.pictures.length; i++) {
		var nameDb = user.pictures[i];

		if(name == nameDb.name){
			return nameDb.picture;
		}
	}

	return null;
};


var User = mongoose.model("Users", UserSchema);

module.exports = {
	User
};
