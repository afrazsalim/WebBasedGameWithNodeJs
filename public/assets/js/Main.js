/** MAIN.js
	This file holds the scripts and functions that interact with
	the localization of the users.
*/
import * as server from "./server_requests.js";
import Localization from "./geolocation.js";

var loc = null;

if ($("#map").length) {
	loc = new Localization(server.sendLocationToServer, server.handShakeWithUser);
	loc.startTracking();
	loc.init();
}


function updatePosition(name, pos) {
	// console.log("update positions was called");
	return loc.updateOtherPos(name, pos);
}
/**function takeDamage( attackerId, hp){
	window.alert(attackerId + ' attacked you. You have '+ hp+'hp left');
}

function succesFullAttack( attackedId){
	window.alert('You succesfully attacked 'attackedId + '.');
}

function die(){
	window.alert("you died...");
}
**/


function handShakeConfirmedWith(username) {
	// console.log("Passed arguments ", username);
	return loc.shakeHands(username);
}

export {
	updatePosition,
	handShakeConfirmedWith
};

// https://stackoverflow.com/a/27724419/2993212
// Babel, browserify, babelify
