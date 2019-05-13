/** SERVER_REQUESTS.js
	This file holds the scripts and functions for the server that need
	to request something from the server. The functions and	scripts in
	this file only affect the server.
*/
let socketUrl = "/";
let socket = io.connect(socketUrl, {
	query: {token: sessionStorage.getItem("token")}
});


function addFace(descriptor) {
	var data = {"data": descriptor};
	$.ajax({
		url: "/addFace",
		method: "POST",
		data: JSON.stringify(data),
		contentType: "application/json",
		headers: {"x-auth": sessionStorage.getItem("token")},
		success: function(data, statusCode, request) { // eslint-disable-line no-unused-vars
			// console.log("succes adding face");
		}
	});
}



$("#logout-button, #log_out-button").on("click", logout);

function logout() {
	emit("Logout");
}


//Should be called when sending a picture to the server to show other players.
//Call this function to send a image to the server.
function sendPictureForApprov(foto){
	emit("foto",foto);
}

function removeUserFromRoom(username) {
	emit("removeUserFromRoom", username);
}

function checkFace(descriptor) {
	emit("checkFaceDescriptor", descriptor);
}

function attack(descriptor) {
	emit("attack", descriptor);
}

function sendLocationToServer(location) {
	emit("Position", location);
}

function handShakeWithUser(username) {
	emit("handShakeWithUser", username);
}

function updateFrequency(newFrequency) {
	emit("frequency", newFrequency);
}

function startGame(time) {
	emit("startGame",time);
}

function sendInvitation(roomName){
	emit("invite",roomName);
}

function selectRoom(roomName) {
	emit("selectRoom", roomName);
}

function logInactivity() {
	emit("inactive");
}

function logActivity() {
	emit("active");
}

function emit(name, data=null) {
	if (!isConnected()) {
		return;
	}

	getSocket().emit(name, data);
}

function isConnected() {
	return getSocket() != null;
}

function getSocket() {
	return socket;
}


export {
	addFace,
	removeUserFromRoom,
	checkFace,
	attack,
	sendLocationToServer,
	handShakeWithUser,
	updateFrequency,
	startGame,
	sendInvitation,
	selectRoom,
	logInactivity,
	logActivity,
	isConnected,
	getSocket
};
