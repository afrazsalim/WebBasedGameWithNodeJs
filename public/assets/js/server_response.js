/** SERVER_RESPONSE.js
	This file holds the scripts and functions for the server that need
	to receive something from the server. The functions and	scripts in
	this file only affect the client-side on command of the server.
*/
import * as server from "./server_requests.js";
import * as ui from "./ui.js";
import * as geolocation from "./main.js";


function getSocket() {
	return server.getSocket();
}

getSocket().on("Logout",function() {
	sessionStorage.removeItem("token");
	sessionStorage.removeItem("data");
	sessionStorage.removeItem("gameStarted");
	window.location.href = "./";
});

getSocket().on("connect", function() {
	// console.log("connected to server");
});

getSocket().on("foto",function(foto){
   // console.log("Foto was sent to you");
});


getSocket().on("randomNumber",function(random){
  console.log("random number sent was ", random);
});

getSocket().on("MatchEnded", function(endPoints) {
	$("#menu-toggle").addClass("disabled");
	$("#camera-button").addClass("disabled");
	$("#speech-container").addClass("disabled");

	ui.hideAllWindows();
	ui.showEnding();
	ui.closeMenu();
	ui.hideBg();

	// console.log("endpoints:", endPoints);

	let table = document.getElementById("end-ranking-table");

	document.querySelectorAll("table tr:not(#header)").forEach(function(item) {
		item.remove();
	});

	for(let i = 0; i < endPoints.length;i++){
		let row = table.insertRow(-1);
		let cell1 = row.insertCell(0);
		let cell2 = row.insertCell(1);
		cell1.innerHTML = endPoints[i].user;
		cell2.innerHTML = endPoints[i].points;
	}
});


//This needs to be done efficiently, meanwhile it should work.
getSocket().on("roomsTaken",function (occupiedRooms) {
	sessionStorage.setItem("roomsTaken", occupiedRooms);
	for(let i = 0; i < 4; i++){
		ui.setRoomSelectable(i);
	}
	for(let j = 0; j < occupiedRooms.length;j++){
		ui.setNewRoomUnselectable(occupiedRooms[j]);
	}
});



getSocket().on("PlayerPoints",function (list)  {
	let table = document.getElementById("tables");
	var pointsList = [];
	 for(let i = 0; i < list.length;i++){
		 var max = i;
		 for(let j = i+1; j > list.length;j++){
				 if(list[j].points < list[min]){
					 max = j;
				 }
		 }
		 pointsList.push(list[max]);
	 }


	console.log("After sorting received list ", pointsList);

	document.querySelectorAll("table tr:not(#header)").forEach(function(item) {
		item.remove();
	});

	for(let i = 0; i < pointsList.length;i++){
		let row = table.insertRow(-1);
		let cell1 = row.insertCell(0);
		let cell2 = row.insertCell(1);
		cell1.innerHTML = pointsList[i].user;
		cell2.innerHTML = pointsList[i].points;
	}
});


getSocket().on("checkFeedback", function(similarities) {
	let table = document.getElementById("table");

	document.querySelectorAll("table tr:not(#header)").forEach(function(item) {
		item.remove();
	});

	for (let name in similarities) {
		let row = table.insertRow(-1);
		let cell1 = row.insertCell(0);
		let cell2 = row.insertCell(1);
		cell1.innerHTML = name;
		cell2.innerHTML = similarities[name];
	}
});

getSocket().on("attacked", function() {
	ui.vibrate(200);

	// alert("You've been attacked, points: " + points);
	ui.pulseAttackScreenRed("You have been attacked!");
});

getSocket().on("attackSuccess", function(newPoints) {
	ui.pulseAttackScreenGreen("Successful attack!");
	ui.vibrate(50);

	document.getElementById("lives").innerHTML = newPoints;
});

getSocket().on("attackFail", function() {
	ui.pulseAttackScreenRed("Attack failed!");
	ui.vibrate(200);
});

//fired when event is recieved from the server, Is used for test atm.
getSocket().on("pong", function () {
  // console.log("Pöng called");
});

//For test
getSocket().on("Test",function () {

});

getSocket().on("disconnect", function (){
	sessionStorage.clear();
	localStorage.setItem("flashMessage", "You have been logged out because you were disconnected from the server");
	window.location.href = "./";
});

getSocket().on("removeUser", function () {
	// console.log("User has been disconnected");
});


getSocket().on("newLocation", function(data) {
	geolocation.updatePosition(data.username, data.pos);
});

getSocket().on("handShakeReq", function  (username) {
	alert("HandShake request from " + username);
	getSocket().emit("handShakeConfirmed",username);
	geolocation.handShakeConfirmedWith(username);
});

getSocket().on("handShakeConfirmed", function (username) {
	alert("Handshake confirmed from " + username);
	geolocation.handShakeConfirmedWith(username);
});

getSocket().on("message", function (message){
	let div = document.createElement("div");
	let title = document.createElement("h1");
	let content = document.createElement("p");

	title.innerHTML = message["title"];
	content.innerHTML = message["content"];

	div.append(title);
	div.append(content);

	document.getElementById("messages").append(div);

	setTimeout(function() {
		div.remove();
	}, 5000);
});

getSocket().on("gameStarted", function (matchTime){
	ui.hideWaitingScreen();
	ui.hideBg();
	ui.startTimer(matchTime);
	sessionStorage.setItem("gameStarted", true);
	ui.titleHandler.setDefaultTitle();
	ui.vibrate([50, 50, 50]);
	getSocket().emit("initialPosition");
});

getSocket().on("initialLocations",function (pos) {
	for(var i = 0; i < pos.length; i++) {
		var user = pos[i];
		geolocation.updatePosition(user.username, user.position);
	}
});

getSocket().on("logout", function(message) {
	if (message != null) {
		localStorage.setItem("flashMessage", "You have been logged out: " + message);
	}

	window.location.href = "./";
});


getSocket().on("priveUserChanged", function(value) {
	alert("Because the priviledged user left you have been selected as next priviledged user.");
	sessionStorage.setItem("data", (value === null) ? null : true);
	goHome();
});




getSocket().on("updateJoinedUsers", function(joinedUsers) {
	ui.updateJoinedUsers(joinedUsers);
});

getSocket().on("roomApproved", function (inviteCode) {
	ui.setInviteCode(inviteCode);
	ui.hideRoomSelection();
});

getSocket().on("Error",function (err) {
	alert(err);
});

getSocket().on("illegalRoomName", function () {
//	ui.hideRoomSelection();
	// console.log("IllegalRoomName");
});

getSocket().on("privUser",function (value){
	sessionStorage.setItem("data", (value === null) ? null : true);
	goHome();
});

getSocket().on("RoomNotAvailable", function () {
	ui.hideRoomSelection();
	// console.log(" session storage " , sessionStorage.getItem("roomsTaken"));
});

getSocket().on("newRoomSelected", function (roomName) {
	ui.setNewRoomUnselectable(roomName);
});


$("#button-start-game").on("click", function(e) {
	e.preventDefault();
	var time = $("#timeInput").val();

	let noTime = time.replace(/[0-9]{2}:[0-5][0-9]/g, "");

	if (noTime == "" && time != "") {
		var timeValues = time.split(":");
		var minutes = parseInt(timeValues[0], 10);
		var seconds = parseInt(timeValues[1], 10);
		var timeleft = minutes * 60 + seconds;

		server.startGame(timeleft);
	} else {
		alert("Wrong time format");
	}
});

function goHome() {
	if (sessionStorage.getItem("gameStarted") == "true") {
		return;
	}
	if (sessionStorage.getItem("data") == "null") {
		// console.log(" The data is now ", sessionStorage.getItem("data"));
		ui.titleHandler.setSingleTitle("Wait for the game to start");
		ui.showPlayerWaitingScreen();
		ui.showBg();
	} else {
		// console.log(" Data is not null ",sessionStorage.getItem("data"));
		ui.titleHandler.setSingleTitle("Configure the game");
		ui.showHostWaitingScreen();
		ui.showBg();
	}
}

$("#map-button").on("click", function(e) {
	e.preventDefault();

	getSocket().emit("initialPosition");

	ui.hideAllWindows();
	ui.closeMenu();
	ui.hideBg();
});
