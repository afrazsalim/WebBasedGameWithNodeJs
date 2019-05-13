// Requiring needed packages
const {
	authenticate
} = require("./middleware/authenticate");
const bodyParser = require("body-parser");
const express = require("express");
const fileSystem = require("fs");
const HashMap = require("hashmap");
const http = require("http");
const jwt = require("jsonwebtoken");
const {
	mongoose
} = require("./db/mongoose");
const path = require("path");
const socketIO = require("socket.io");
const {
	User
} = require("./models/user");
const _ = require("lodash");

// Constants of the script
const app = express();
const faces = {};
const {
	isRealString
} = require("./validator");

const publicPath = path.join(__dirname, "../public");
const server = http.createServer(app);
const socketID = new HashMap();
const userPosition = new HashMap();
const room_list = ["Bugs Bunny", "Micky Mouse", "Scooby Doo", "Donald Duck", "Popeye"];
const usersTokenMap = [];
const reconnectTime = 20000;
var usersList = [];
var numberOfUsersPerRoom = new HashMap();
var roomList = [];
var occupiedRooms = [];
var userToRoom = [];
var sessionTime = new HashMap();
var tokenToUsername = new HashMap();

// Variables of the script
var privilegedUser = null;
var pingInterval = 9000000;
var pingTimeOut = 9000000;
var hasGameStarted = false;
var pointsMap = new HashMap();
//Exception: otherwise pingInterval and pintTimeOut will not work.catch
var io = socketIO(server);

// Initializing app
app.use(bodyParser.json());
app.use("/", express.static(publicPath));
app.get("lo");

// io.attach(server, {
//   pingInterval: pingInterval,
//   pingTimeout: pingTimeOut,
//   cookie: false
// });

io.use(function(socket, next) {
	console.log("Sockets are now connected");
	if (socket.handshake.query && socket.handshake.query.token) {
		jwt.verify(socket.handshake.query.token, "abc123", function(err, decoded) {
			if (err) {
				return next(new Error("Authentication error"));
			}
			socket.decoded = decoded;
			next();
		});
	} else {
		next(new Error("Authentication error"));
	}
});

function getPingInterval() {
	return pingInterval;
}

function getTimeOut() {
	return pingTimeOut;
}

function initializeRoomList() {
	for (let i = 0; i < room_list.length; i++) {
		numberOfUsersPerRoom.set(room_list[i], 1);
	}
}

io.on("connection", function(socket) {
	var token = socket.handshake.query.token;
	User.findByToken(token).then((user) => {
		sessionTime.set(user.username,0);
	});
	socketID.set(token, socket.id);
	socket.on("disconnect", () => {
		handleDisconnectEvent();
/*		var currentTime =  setTimeout(function(){
			User.findByToken(token).then((user) => {
				console.log("Checked token", token);
				sessionTime.set(user.username,sessionTime.get(user.username)+1);
				var difference =reconnectTime - sessionTime.get(user.username);
				console.log("Time left i s" ,difference);
				if(difference+1 === reconnectTime){
					console.log("Time left i s B" );
					handleDisconnectEvent();
				}
			}).catch((e) => {
				 console.log("Time is not fixed");
			});
		}, reconnectTime);*/
	});

	function handleDisconnectEvent(){
		User.findByToken(token).then((user) => {
			var body = {
				"username": user.username,
				"pos": null
			};
			//user.addRoomNumber(-1);
			// TODO: Remove emtpy rooms from unselectable rooms list
			io.to(user.room).emit("newLocation", body);
		}).catch((e) => {
			socket.emit("Could not save location, possible that you are not logged in!");
		});
		User.findByToken(token).then((user) => {
			removeUser(user);

			var body = {
				"username": user.username,
				"pos": null
			};
			console.log("Remmoving room number");
			io.to(user.room).emit("newLocation", body);
			choosePrivUser();
			console.log("Removing user");
		}).catch((e) => {
			socket.emit("Could not save location, possible that you are not logged in!");
		});
		checkForPictureValidity();
	}




	function checkForPictureValidity(){
		console.log("Checking for validity");
		User.findByToken(token).then((user) => {
			if(user != null && user.pictures.length === 0){
				var query = { username:user.username};
				User.deleteOne(query, function (err, result) {
					if (err) {
						console.log("error query");
					} else {
						socket.emit("Error","No picture was found in database and your account has been removed");
					}
				});
			}
		});
	}



	socket.on("frequency", (value) => {
		User.findByToken(token).then((user) => {
			for (let i = 0; i < roomList.length; i++) {
			if (parseInt(roomList[i].getRoomId()) === parseInt(user.room)) {
          if(roomList[i].getPrivUser().username === user.username){
						setPingInterval(value);
						break;
					}
			 }
	  	}
		}).catch((e) => {
			socket.emit("Could not save location, possible that you are not logged in!");
		});
	});

	socket.on("join", (param, callback) => {
		if (!isRealString(param)) {
			callback("Error with room number");
		}
		socket.join(param);
		numberOfUsersPerRoom.set(param, numberOfUsersPerRoom.get(param) + 1);
		//New Code
		if (!isRealString(param)) {
			callback("Error with room number");
		}

		//io.to('room number').emit()
		//socket.broadcast('roomnumber').emit();
		//socket.broadcast.to(param).emit('newMessage','A new user has joined the room')
	});

	socket.on("test", () => {
		console.log("Test was called");
	});

	socket.on("handShakeWithUser", (username) => {
		User.findOne({
			"username": username
		}).then((user) => {
			User.findOne({
				"tokens.token": token
			}).then((sender) => {
				if (username !== user.username) {
					io.to(`${socketID.get(user.tokens[0].token)}`).emit("handShakeReq", sender.username);
				}
			}).catch((e) => {
				console.log("Could not find the picture");
			});
		}).catch((e) => {
			socket.emit("Could not send location, possible that you are not logged in!");
		});
	});

	//TODO:Need to remove token of other user.(Tokens should not be accesible for other user)
	socket.on("handShakeConfirmed", (username) => {
		User.findOne({
			"username": username
		}).then((user) => {
			User.findOne({
				"tokens.token": token
			}).then((sender) => {
				io.to(`${socketID.get(user.tokens[0].token)}`).emit("handShakeConfirmed", sender.username);
			}).catch((e) => {});
			console.log("Token of the user is ", user.username);
		}).catch((e) => {
			socket.emit("Could not send location, possible that you are not logged in!");
		});
	});

	socket.on("attack", (descriptor) => {
		const threshold = 0.52;
		let players = [];
		User.findOne({
			"tokens.token": token
		}).then((user) => {
			players = sortPlayersOnDistance(user.username, userPosition);
		}).catch((e) => {
			socket.emit("Error", "Something went wrong");
		});
		console.log("players close enough:", players);
		User.findOne({
			"tokens.token": token
		}).then((user) => {
			User.find({}, function(err, users) {
				let closest = [];
				for (let i = 0; i < users.length; i++) {
					var currUser = users[i];
					if ((currUser.username !== user.username) && currUser.room > -1) {
						console.log("Found same room", currUser.username, " ", user.username);
						let userName = currUser.username; //Current user
						let pictures = currUser.pictures; //List of picture

						for (let j = 0; j < pictures.length; j++) {
							let currPicture = pictures[j].picture;
							let sum = 0;

							for (let k = 0; k < Object.keys(descriptor).length; k++) {
								sum += Math.pow(descriptor[k] - currPicture[k], 2);
							}

							var sim = Math.sqrt(sum);

							if (closest.length === 0 || closest[1] > sim) {
								console.log("New closest ", closest);
								closest = [currUser, sim];
							}
							console.log("Similarity: ", userName, " - ", sim);
						}

						if (closest.length !== 0 && closest[1] < threshold) {
							let currUser = closest[0];
							let userName = currUser.username;

							var points = pointsMap.get(user.username);

							pointsMap.delete(user.username);
							var newPoints = points + 35;
							pointsMap.set(user.username, newPoints);

							if (newPoints < 0) {
								var body = {
									"username": userName,
									"pos": null
								};
								socket.broadcast.emit("newLocation", body);
							}
							if ((currUser != undefined || currUser != NULL) && currUser.tokens.length > 0) {
								io.to(`${socketID.get(currUser.tokens[0].token)}`).emit("attacked");
								socket.emit("attackSuccess", newPoints);
								for (let k = 0; k < roomList.length; k++) {
									if (roomList[k].getRoomId() == user.room) {
										roomList[k].updateUserPoints(user, pointsMap.get(user.username));
										io.to(user.room).emit("PlayerPoints", roomList[k].getAllPlayersPoints());
										io.emit("PlayerPoints", roomList[k].getAllPlayersPoints());
										break;
									}
								}
							}

							closest[0] = userName;
						} else {
							closest = [];
							socket.emit("attackFail");
						}

						//	socket.emit("attackResult", closest);
					}
				}
			});
		}).catch((e) => {
			socket.emit("Error", "Something went wrong");
		});
	});

	function isInRoom(user, token) {
		User.findByToken(token).then((temp) => {
			console.log("Testing for online", user.username);
			if (temp.room == user.room) {
				console.log("Returning true for ", user.username);
				return true;
			}
		}).catch((e) => {
			socket.emit("Error", "Something went wrong");
		});
		return false;
	}

	socket.on("checkFaceDescriptor", (descriptor) => {
		//gets ll the pictures in the database to be compared.
		let foundUsers;
		const similarities = {};

		User.find({}, function(err, users) {
			for (let i = 0; i < users.length; i++) {
				let currUser = users[i];
				let userName = currUser.username; //Current user
				let pictures = currUser.pictures; //List of picture

				for (let j = 0; j < pictures.length; j++) {
					let currPicture = pictures[j].picture;
					let sum = 0;

					for (let k = 0; k < Object.keys(descriptor).length; k++) {
						sum += Math.pow(descriptor[k] - currPicture[k], 2);
					}

					similarities[userName] = Math.sqrt(sum);
				}
			}
			socket.emit("checkFeedback", similarities);
		}).catch((e) => {
			socket.emit("Error", "Something went wrong");
		});
	});

	socket.on("startGame", (time) => {
		matchTime = time;
		console.log("Initial time give ", matchTime, " Token is ", token);
		User.findOne({
			"tokens.token": token
		}).then((user) => {
			if (!allUsersHaveLocation(user.room)) {
				throw "Not all users sent locations.";
			}

			console.log("Sedning start command   ====", user);
			for (let i = 0; i < roomList.length; i++) {
				if (parseInt(roomList[i].getRoomId()) === parseInt(user.room)) {
					roomList[i].setGameStarted(true);
					roomList[i].addUserPoints(user, 0);
					setInterval(function(){
						roomList[i].generateRandomNumber();
						io.to(user.room).emit("randomNumber", roomList[i].getRandomNumber());
					},30000);
					io.to(user.room).emit("PlayerPoints", roomList[i].getAllPlayersPoints());
					roomList[i].generateRandomNumber();
					io.to(user.room).emit("randomNumber", roomList[i].getRandomNumber());
					break;
				}
			}
			//socket.emit("gameStarted", matchTime);
			io.in(user.room).emit("gameStarted", matchTime);
			setTimeout(function() {
				let endPoints = null;

				for (let i = 0; i < roomList.length; i++) {
					if (parseInt(roomList[i].getRoomId()) === parseInt(user.room)) {
						endPoints = roomList[i].getAllPlayersPoints();
						break;
					}
				}

				socket.emit("MatchEnded", endPoints);
				socket.broadcast.emit("MatchEnded", endPoints);
			}, (matchTime + 2) * 1000);
		}).catch((e) => {
			socket.emit("Error", "Cannot start game! " + e);
		});
	});

	function startGameForThisRoom(user, matchTime) {

	}

	function allUsersHaveLocation(roomName) {
		for (let i = 0; i < roomList.length; i++) {
			if (parseInt(roomList[i].getRoomId()) === parseInt(roomName)) {
				for (let index in roomList[i].getPlayers()) {
					if (userPosition.get(roomList[i].getPlayers()[index].username) == null) {
						return false;
					}
				}
			}
		}

		return true;
	}


	function endGameInterval(user, matchTime) {
	 // 2 seconds bonus for network lag issues**/
	}


	socket.on("selectRoom", (roomName) => {
		if (!roomName instanceof String || isNaN(roomName)) {
			socket.emit("illegalRoomName");
		} else if (containsRoom(roomName)) {
			socket.emit("RoomNotAvailable");
		} else {
			User.findByToken(token).then((user) => {
				console.log("Token is ", token);
				console.log("User was found ", user);
				occupiedRooms.push(roomName);
				console.log(occupiedRooms);
				const room = new Room(roomName, user);
				roomList.push(room);
				user.addRoomNumber(roomName);
				console.log(roomName);
				console.log(user.room);
				userToRoom.push({
					roomName: roomName,
					userName: user.username
				});
				socket.join(roomName);
				//privilegedUser = user;
				socket.emit("privUser", true);

				for (let i = 0; i < roomList.length; i++) {
					if (roomList[i].getRoomId() == roomName) {
						socket.emit("updateJoinedUsers", getJoinedUsers(roomList[i]));
					}
				}

				socket.emit("roomApproved", roomName);
				socket.broadcast.emit("newRoomSelected", roomName);
			}).catch((e) => {
				socket.emit("Error", "User is not logged in.");
			});
		}
	});

	socket.on("initialPosition", () => {
		User.findByToken(token).then((user) => {
			sendInitialData(user);
		}).catch((e) => {
			socket.emit("Error", "Something went wrong");
		});
	});


	function sendInitialData(user) {
		console.log("Sending inital data");
		var currentRoom;
		var users = [];
		var temp = [];
		for (let i = 0; i < roomList.length; i++) {
			if (parseInt(roomList[i].getRoomId()) === parseInt(user.room)) {
				currentRoom = roomList[i];
				break;
			}
		}
		for (let j = 0; j < currentRoom.getPlayers().length; j++) {
			player = currentRoom.getPlayers()[j];
			userPosition.forEach(function(value, key) {
				if (temp.indexOf(key) < 0 && player.username == key && user.username !== player.username) {
					temp.push(key);
					users.push({
						"username": key,
						"position": value
					});
				}
			});
		}
		socket.emit("initialLocations", users);
	}

	socket.on("foto",(foto) => {
		User.findOne({
			"tokens.token": token
		}).then((user) => {
			for (let i = 0; i < roomList.length; i++) {
				if (roomList[i].getRoomId() == user.room) {
					socket.to(user.room).emit("foto", foto);
					break;
				}
			}
		});
	});



	socket.on("Position", (pos) => {
		User.findOne({
			"tokens.token": token
		}).then((user) => {
			userPosition.set(user.username, pos);
			emitLocations(user, pos);

			for (let i = 0; i < roomList.length; i++) {
				if (roomList[i].getRoomId() == user.room) {
					io.to(user.room).emit("updateJoinedUsers", getJoinedUsers(roomList[i]));
				}
			}
		}).catch((e) => {
			socket.emit("Could not send location, possible that you are not logged in!");
		});
	});


	function emitLocations(user, pos) {
		var roomName = user.room;
		var body = {
			"username": user.username,
			"pos": pos
		};
		socket.to(user.room).emit("newLocation", body);
	}

	//For tests
	socket.on("printInfo", () => {
		User.findByToken(token).then((user) => {
			io.to(user.room).emit("Test", user.username);
		}).catch((e) => {
			socket.emit("Error", "Something went wrong");
		});
	});



	socket.on("invite", (roomName) => {
		if (isNaN(roomName)) {
			socket.emit("Error", "Room number should be an integer");
		} else if (doesNotExistRoom(roomName)) {
			socket.emit("Error", "Room Does not exist with this ID, Create a room first");
		} else {
			socket.join(roomName);
			User.findByToken(token).then((user) => {
				for (let i = 0; i < roomList.length; i++) {
					if (roomList[i].getRoomId() == roomName) {
						roomList[i].addPlayers(user);
						roomList[i].addUserPoints(user, 0);
						user.addRoomNumber(roomName);
						userToRoom.push({
							roomName: roomName,
							userName: user.username
						});
						startGame(roomName, user);
						socket.emit("roomApproved");

						io.to(roomName).emit("updateJoinedUsers", getJoinedUsers(roomList[i]));
						break;
					}

				// socket.broadcast.emit("roomUpdateNumberOfPlayers", {name:roomName,numberOfPlayers:roomList[i].getPlayers().length});
				}
			}).catch((e) => {
				socket.emit("Error", "Something went wrong");
			});
		}
	});

	function getJoinedUsers(room) {
		let joinedUsers = [];
		let players = room.getPlayers();

		for (let index in players) {
			joinedUsers.push({
				username: players[index].username,
				locationReceived: (userPosition.get(players[index].username) == null) ? "No" : "Yes"
			});
		}

		return joinedUsers;
	}


	function startGame(roomName, user) {
		for (let i = 0; i < roomList.length; i++) {
			if (roomList[i].getRoomId() == roomName) {
				if (roomList[i].isGameStarted()) {
					io.to(user.room).emit("PlayerPoints", roomList[i].getAllPlayersPoints());
					console.log("For user ", user.username, " Positions are ", userPosition.get(user.username));
					socket.to(user.room).emit("newLocation", {
						username: user.username,
						pos: userPosition.get(user.username)
					});
					socket.emit("gameStarted");
				}
			}
		}
	}

	let activityTimeout = null;

	socket.on("inactive", () => {
		User.findByToken(token).then((user) => {
			activityTimeout = setTimeout(() => {
				removeUser(user);
				user.addRoomNumber(-1);
				console.log("Log out in inactive**********************************");
				socket.emit("logout");
			}, 60000);
		});
		// console.log("user inactive");
	});

	socket.on("active", () => {
		// console.log("user active");
		clearTimeout(activityTimeout);
		activityTimeout = null;
	});


	socket.on("Logout", () => {
		console.log("Logout callled 3333333333333333333333333333333333333333");
		User.findByToken(token).then((user) => {
			removeUser(user);
			user.addRoomNumber(-1);
		}).catch((e) => {
			socket.emit("Error", "Something went wrong");
		});

		User.findByToken(token).then((user) => {
			user.removeToken(token).then(() => {
				socket.emit("Logout");
			}).catch((e) => {
				socket.emit("Error", "Something went wrong");
			});
		}).catch((e) => {
			socket.emit("Error", "Something went wrong");
		});
	});



	function choosePrivUser(){
		console.log("Priv user was called");
		User.findByToken(token).then((user) => {
			console.log("Priv user was called " , user);
		for (let i = 0; i < roomList.length; i++) {
			console.log("Priv user was called after loop" , roomList[i].getPrivUser().username );
				if(roomList[i].getPrivUser().username === user.username){
					console.log("Priv user was found " , user);
					if(roomList[i].getPlayers().length  > 0){
						roomList[i].setPrivUser(roomList[i].getPlayers()[0]);
						console.log("New Priv user is ", roomList[i].getPlayers()[0]);
						io.to(`${socketID.get(roomList[i].getPlayers()[0].tokens[0].token)}`).emit("priveUserChanged", true);
						break;
					}
				}
		}
	});
	}

	function removeUser(user) {
		console.log("removing user, room:", user.room);
		console.log(user.username);
		var toRemove = -1;
		var currRoom = null;

		for (let j = 0; j < roomList.length; j++) {
			if (parseInt(user.room) === parseInt(roomList[j].getRoomId())) {
				roomList[j].removeUser(user);
				currRoom = roomList[j];
				break;
			}
		}

		for (let i = 0; i < usersList.length; i++) {
			if (usersList[i] == user.username) {
				toRemove = i;
				break;
			}
		}
		usersList.splice(toRemove, 1);

		if (currRoom != null && currRoom.players.length <= 0) {
			var removeRoomAt = roomList.indexOf(currRoom.getRoomId());
			console.log(occupiedRooms);
			occupiedRooms.splice(removeRoomAt, 1);
			console.log(occupiedRooms);
		}
		console.log("Emitting players");
		if (!currRoom.isGameStarted()) {
			socket.to(user.room).emit("updateJoinedUsers", getJoinedUsers(currRoom));
		} else {
			socket.to(user.room).emit("PlayerPoints", currRoom.getAllPlayersPoints());
		}
		user.addRoomNumber(-1);
		socket.broadcast.emit("roomsTaken", occupiedRooms);
	}

	socket.on("removeUserFromRoom", function(username) {
		User.findByToken(token).then((privUser) => {
			let room = getRoomFor(privUser);

			if (room.getPrivUser().username != privUser.username) {
				socket.emit("Error", "Not allowed: no priv user");
				return;
			}

			if (privUser.username == username) {
				socket.emit("Error", "Not allowed: cannot remove yourself");
				return;
			}

			User.findOne({
				"username": username
			}).then((user) => {
				if (user.room != room.getRoomId()) {
					socket.emit("Error", "Not allowed: user not in room");
					return;
				}

				socket.to(`${socketID.get(user.tokens[0].token)}`).emit("logout", "The host logged you out");
				removeUser(user);
				room.removeUser(user);
				user.addRoomNumber(-1);

				socket.emit("updateJoinedUsers", getJoinedUsers(room));
			});
		}).catch((e) => {
			socket.emit("Error", "Could not remove user: " + e);
		});
	});
});




function getRoomFor(user) {
	var roomId;
	for (let i = 0; i < roomList.length; i++) {
		if (roomList[i].getRoomId() == user.room) {
			return roomList[i];
		}
	}
}

function doesNotExistRoom(roomName) {
	for (let i = 0; i < roomList.length; i++) {
		if (roomList[i].getRoomId() == roomName) {
			return false;
		}
	}
	return true;
}

function containsRoom(roomName) {
	for (let i = 0; i < occupiedRooms.length; i++) {
		if (occupiedRooms[i] == roomName) {
			return true;
		}
	}
	return false;
}

app.post("/sign-up", (req, res) => {
	var body = _.pick(req.body, ["username", "password"]);
	var user = new User(body);
	user.save().then((user) => {
		return user.generateAuthToken();
	}).then((token) => {
		usersList.push(user.username);
		pointsMap.set(body.username, 0);
		var toSend = {
			"user": user.username,
			"privUser": null,
			"gameStarted": hasGameStarted,
			"roomsTaken": occupiedRooms
		};
		res.status(200).header("x-auth", token).send(toSend, "200", req);
	}).catch((e) => {
		if (e.code === 11000) {
			res.status(400).send({
				"message": "That username is already in use",
				"recipient": null
			});
		} else {
			res.status(400).send({
				"message": e.message,
				"recipient": null
			});
		}
	});
});


/**

if (privilegedUser == null || privilegedUser == undefined){
	privilegedUser = user;
	var toSend = {"user":user.username,"privUser":null,"gameStarted":hasGameStarted,"roomsTaken":occupiedRooms};
	res.status(200).header("x-auth", token).send(toSend, "200", req);
} else {**/


app.post("/login", (req, res) => {
	var body = _.pick(req.body, ["username", "password"]);
	// console.log(body.username, body.password);
	User.findByData(body.username, body.password).then((user) => {
		user.generateAuthToken().then((token) => {
			usersList.push(user.username);
			pointsMap.set(body.username, 0);
			var toSend = {
				"user": user.username,
				"privUser": null,
				"gameStarted": hasGameStarted,
				"roomsTaken": occupiedRooms
			};
			res.status(200).header("x-auth", token).send(toSend, "200", req);
		});
	}).catch((e) => {
		res.status(400).send(e);
	});
});


/**app.post("/getPositionsOfAllUsers", authenticate, (req, res) => {
	var users = [];
	User.findOne({"tokens.token": req.header("x-auth")}).then((user) => {
		sendInitialData(res,user);
	}).catch((e) => {
		res.status(400).send(e);
	});
});**/






function setPingInterval(value) {
	io.attach(server, {
		pingInterval: value * 1000,
		pingTimeout: 5000,
		cookie: false
	});
	pingInterval = (value * 1000);
}


app.post("/gameStarted", (req, res) => {
	//	hasGameStarted = true;
});

app.post("/addFace", (req, res) => {
	var body = _.pick(req.body, ["data"]);
	var token = req.header("x-auth");
	var dat = {
		"picture": body.data
	};
	User.findOne({
		"tokens.token": token
	}).then((user) => {
		return user.savePicture(dat);
	}).catch((e) => {

	});
});



app.post("/getRoomList", (req, res) => {
	console.log("I have been called");
	res.status(200).header("x-auth", "").send(room_list, "200", req);
});



app.get("/camera", authenticate, (req, res) => {
	res.send(req.user);
});


//Name of picture, Token of a logged in Users.
var getFeatureVector = (name, token) => {
	User.findOne({
		"tokens.token": token
	}).then((user) => {
		return user.featureVector(name);
	}).catch((e) => {
		console.log("Could not find the picture");
	});
};


server.listen(3000, () => {
	User.find({}, function(err, users) {
		console.log("Removing all tokens");
		for (let i = 0; i < users.length; i++) {
			users[i].removeToken("");
		}
	});
	initializeRoomList();
	User.find({}, function(err, users) {
		for (let i = 0; i < users.length; i++) {
			users[i].addRoomNumber(-1);
		}
	});
	console.log("Server is up on port", 3000);
});




function sortPlayersOnDistance(centreId, userPositions) {
	const nearest = [];

	const centre = userPositions.get(centreId);
	const keys = userPositions.keys();

	userPositions.forEach((value, key) => {
		const dist = distanceBetween(centre, value[1]);
		console.log("distance:", dist);

		if (nearest.length < 5) {
			nearest.push([key, dist]);
			return;
		}

		for (let k = 0; k < nearest.length; k++) {
			if (dist < distanceBetween(nearest[k], value[1])) {
				nearest[k] = [key, dist];
				break;
			}
		}
	});

	console.log("nearest:", nearest);
	return nearest;
}

function distanceBetween(pt1, pt2) {
	const distanceSquared = square(pt1[0] - pt2[0]) + square(pt1[1] - pt2[1]);

	return Math.sqrt(distanceSquared);
}

function square(item) {
	return Math.pow(item, 2);
}

app.get("*", function(req, res) {
	res.writeHead(302, {
		"Location": "404.html"
	});
	res.end();
});


//This will go in separate module
class Room {
	constructor(id, priviledgeUser) {
		this.id = id;
		this.priviledgeUser = priviledgeUser;
		this.players = [];
		this.players.push(priviledgeUser);
		this.gameStarted = false;
		this.userPoints = [];
		this.randomNumber = 1;
	}

	getRoomId() {
		return this.id;
	}


	addUserPoints(user, points) {
		this.userPoints.push({
			user: user.username,
			points: points
		});
	}

	getAllPlayersPoints() {
		return this.userPoints;
	}

	updateUserPoints(user, newPoints) {
		var temp = [];
		for (let i = 0; i < this.userPoints.length; i++) {
			var first = this.userPoints[i];
			if (first.user != user.username) {
				temp.push(first);
			} else {
				temp.push({
					user: user.username,
					points: newPoints
				});
			}
		}
		this.userPoints = temp;
		console.log("New points have been assigned ", this.userPoints);
	}

	//Need to test if it works.
	removeUser(user) {
		var toRemove = -1;
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].username == user.username) {
				toRemove = i;
				break;
			}
		}
		if (toRemove >= 0) {
			this.players.splice(toRemove, 1);
		}
		var removeElements = -1;
		for (let j = 0; j < this.userPoints.length; j++) {
			if (user.username === this.userPoints[j].user) {
				removeElements = j;
				break;
			}
		}
		if (removeElements > -1) {
			this.userPoints.splice(removeElements, 1);
		}
	}
   setPrivUser(user){
		 this.priviledgeUser = user;
	 }


  getPrivUser(){
		return this.priviledgeUser;
	}

	getPlayers() {
		return this.players;
	}

	addPlayers(player) {
		this.players.push(player);
	}

	isGameStarted() {
		return this.gameStarted;
	}

	setGameStarted(state) {
		this.gameStarted = state;
	}
  getRandomNumber(){
		return this.randomNumber;
	}

	generateRandomNumber(){
		this.randomNumber =  Math.floor((Math.random() * 3) + 1);
	}
}
