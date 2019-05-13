/** UI.js
	This file holds the scripts and functions for the UI that don't need
	interaction with other services (e.g. the server). The functions and
	scripts in this file only affect the DOM.
*/


//import * as my1 from "./MY1_app.js";


// Window loads
window.onload = function() {
	if (sessionStorage.getItem("gameStarted") == "true") {
		hideRoomSelection();
		hideWaitingScreen();
		hideBg();
		titleHandler.setDefaultTitle();
	} else {
		setRoomsUnselectable(sessionStorage.getItem("roomsTaken"));
	}

	if (!sessionStorage.getItem("token") && $(".login").length === 0) {
		sessionStorage.clear();
		window.location.href = "./";
	}
};

// jQuery loads
$(function() {
	animateEntrance();

	$("input").focusout(function() {
		const input_val_length = $(this).val().length;

		if (input_val_length === 0) {
			$(this).removeClass("has-content");
		} else {
			$(this).addClass("has-content");
		}
	});
});

$(window).on("resize", animateEntrance);

function animateEntrance() {
	if (! $("#background-wolf").hasClass("right-0")) {
		$("#background-wolf").addClass("right-0");
	}

	if (! $("#waiting-screen").hasClass("top-0") && sessionStorage.getItem("gameStarted") != "true") {
		$("#waiting-screen").addClass("top-0");
	}

	if (! $("#room-selection-screen").hasClass("top-0") && sessionStorage.getItem("gameStarted") != "true") {
		$("#room-selection-screen").addClass("top-0");
	}
}

function setRoomsUnselectable(rooms) {
	if (rooms == null) {
		return;
	}

	let defaultSelected = false;

	$("#room-selection-screen .option").each((index, value) => {
		if (rooms.includes($(value).data("room-name"))) {
			$(value).addClass("unselectable");
			$(value).removeClass("selected");

			if (!defaultSelected) {
				$(value).next().addClass("selected");
				defaultSelected = true;
			}
		} else if (!defaultSelected) {
			defaultSelected = true;
		}
	});
}

function setNewRoomUnselectable(newUnselectableRoom) {
	$("#room-selection-screen .option:not(.unselectable)").each((index, value) => {
		if ($(value).data("room-name") == newUnselectableRoom) {
			$(value).addClass("unselectable");

			if ($(value).hasClass("selected")) {
				$(value).removeClass("selected");

				$(value).next(":not(.unselectable)").addClass("selected");
			}
		}
	});
}

function setRoomSelectable(room) {
	$("#room-selection-screen .option:not(.unselectable)").each((index, value) => {
		if ($(value).data("room-name") == room) {
			$(value).addClass("selectable");
			if ($(value).hasClass("selected")) {
				$(value).removeClass("selected");

			//	$(value).next(":not(.unselectable)").addClass("selected");
			}
		}
	});
}

function startTimer(matchTime) {
	let timerInterval = setInterval(function() {
		let minutesleft = Math.floor((matchTime - (matchTime % 60)) / 60);
		let secondsleft = Math.floor(matchTime - minutesleft * 60);

		if (minutesleft == 0) {
			$("#timer").html("Time left " + secondsleft);
		}

		if (secondsleft > 9) {
			$("#timer").html("Time left " + minutesleft + ":" + secondsleft);
		} else {
			$("#timer").html("Time left " + minutesleft + ":0" + secondsleft);
		}

		matchTime -= 1;

		if (matchTime <= 0) {
			$("#timer").html("Finished");
			clearInterval(timerInterval);
		}
	}, 1000);
}

function pulseAttackScreenGreen(text="") {
	$("#attack").addClass("win");

	pulseAttackScreen(text);
}

function pulseAttackScreenRed(text="") {
	$("#attack").removeClass("win");

	pulseAttackScreen(text);
}

function pulseAttackScreen(text="") {
	let attackScreen = $("#attack");
	let attackMessage = $("#attack .attackmessage");

	attackMessage.html(text);

	if (text == "") {
		attackMessage.removeClass("show");
	} else {
		attackMessage.addClass("show");
	}

	attackScreen.css("display", "unset").hide().fadeIn(500, function() {
		setTimeout(function() {
			attackScreen.fadeOut(500);
		}, 500);
	});
}

function updateJoinedUsers(joinedUsers) {
	let table = document.getElementById("user-table");

	document.querySelectorAll("table tr:not(#header)").forEach(function(item) {
		item.remove();
	});

	for (let index in joinedUsers) {
		let row = table.insertRow(-1);
		let cell1 = row.insertCell(0);
		let cell2 = row.insertCell(1);
		let cell3 = row.insertCell(2);
		cell1.innerHTML = joinedUsers[index].username;
		cell2.innerHTML = joinedUsers[index].locationReceived;
		cell3.innerHTML = "<a href='#' class='remove-user-from-room' data-username='" + joinedUsers[index].username + "'><i class='material-icons'>delete_forever</i></a>";
	}
}

function setInviteCode(inviteCode) {
	$(".room-invite-code").html(inviteCode);
}

function showCamera() {
	var cameraWrapper = $("#camera");

	cameraWrapper.css("z-index", "100");
	cameraWrapper.fadeIn(250);
}

function abortCamera() {
	var cameraWrapper = $("#camera");

	cameraWrapper.fadeOut(250);
	cameraWrapper.css("z-index", "-1");
}

function closeMenu() {
	$("#menu-toggle").removeClass("active");
	$("#menu").removeClass("show");
}

function hideAllWindows() {
	hideWaitingScreen();
	hideDatabaseCheck();
	hideRanking();
	hideRules();
	hideEnding();
	//my1.hideMessages();
}

function hideWaitingScreen() {
	$("#waiting-screen").fadeOut();
}

function showBg() {
	$("#bg").fadeIn();
}

function hideBg() {
	$("#bg").fadeOut();
}

function showDatabaseCheck() {
	$("#check-face-database").fadeIn();
}

function hideDatabaseCheck() {
	$("#check-face-database").fadeOut();
}

function showHostWaitingScreen() {
	$("#waiting-screen .host-specific").each((index, value) => {
		$(value).show();
	});

	$("#waiting-screen .explanation-player").hide();
}

function showPlayerWaitingScreen() {

}

function showRanking() {
	$("#ranking").fadeIn();
}

function hideRanking(){
	$("#ranking").fadeOut();
}

function showRules() {
	$("#rules").fadeIn();
}

function hideRules() {
	$("#rules").fadeOut();
}

function showEnding() {
	$("#ending").fadeIn();
}

function hideEnding() {
	$("#ending").fadeOut();
}


function hideRoomSelection() {
	$("#room-selection-screen").fadeOut();
}

function enableCamera() {
	$("#accept-camera").removeClass("disabled");
}

function enableCameraAbort() {
	$("#abort-camera").removeClass("disabled");
}

function setElementData(elementIdentifier, dataName, dataValue) {
	$(elementIdentifier).data(dataName, dataValue);
}

function getElementData(elementIdentifier, dataName) {
	return $(elementIdentifier).data(dataName);
}

function changeUrl(newPath) {
	window.history.pushState({}, "", newPath);
}

function vibrate(length) {
	navigator.vibrate(length);
}

class SpeechHandler {
	/**
	 * 	This class manages the speech ability of the game. It listens to the
	 *	user's speech and returns a result if one is found.
	 */
	constructor() {
		this.recognition = new webkitSpeechRecognition();
		this.recognition.continuous = false;

		this.recognition.addEventListener("result", (res) => {
			this.processResults(res);
		});

		this.recognition.addEventListener("nomatch", () => {
			this.processResults(null);
		});

		this.callback = null;
	}

	processResults(results) {
		if (results != null) {
			results = results.results;
		}

		this.callback(results);
	}

	start(callback=null) {
		this.callback = callback;
		this.recognition.start();
	}

	stop() {
		this.recognition.stop();
	}
}

class TitleHandler {
	/**
	 * 	This class manages the title of the page. It rotates through the titles
	 *	given, or shows the title given with a changeable interval between the
	 *	titles.
	 */
	constructor(interval=2000) {
		this.titles = [document.title];
		this.interval = interval;

		this.titleRotation = null;
	}

	_getDefaultTitle(numberOfNotifications=0) {
		let prefix = "";

		if (numberOfNotifications > 0) {
			prefix = "(" + numberOfNotifications + ") ";
		}
		return prefix + "World of Wolves";
	}

	setInterval(interval) {
		this.interval = interval;
		this.stopRotation();
		this.startRotation();
	}

	getInterval() {
		return this.interval;
	}

	setDefaultTitle() {
		this.setSingleTitle(this._getDefaultTitle());
	}

	setTitles(titles) {
		if (typeof titles === "string") {
			titles = [titles];
		}

		if (Array.isArray(titles) === false) {
			return;
		}

		titles.unshift(this._getDefaultTitle(titles.length));

		this.resetCounter();
		this.titles = titles;

		if (this.titleRotation === null) {
			this.startRotation();
		}
	}

	setSingleTitle(title) {
		if (title !== this._getDefaultTitle()) {
			title += " | World of Wolves";
		}

		this.titles = [title];
		this.stopRotation();

		this._setTitle(title);
	}

	addTitle(title) {
		if (typeof title !== "string") {
			return;
		}

		let titles = this.getTitles();
		titles.shift();
		titles.push(title);

		this.setTitles(titles);
	}

	changeTitle(index, newTitle) {
		if (index === 0) {
			return;
		}

		let titles = this.getTitles();
		titles.shift();
		titles[index] = newTitle;

		this.setTitles(titles);
	}

	removeTitle(title) {
		const titleIndex = this.getTitles().indexOf(title);

		if (titleIndex === -1) {
			return;
		}

		if (titleIndex === this.getTitles().length - 1) {
			this.resetCounter();
		} else {
			this.setCounter(this.getCounter() - 1);
		}

		let titles = this.titles;
		titles.splice(titleIndex, 1);
		titles.shift();
		this.setTitles(titles);
	}

	getTitles() {
		return this.titles;
	}

	resetCounter() {
		this.setCounter(0);
	}

	setCounter(i) {
		this.counter = i;
	}

	getCounter() {
		return this.counter;
	}

	startRotation() {
		this.titleRotation = setInterval(() => {
			let currentCounter = this.getCounter();
			let nextCounter = (currentCounter + 1) % this.getTitles().length;

			let nextTitle = this.getTitles()[currentCounter];

			this._setTitle(nextTitle);
			this.setCounter(nextCounter);
		}, this.getInterval());
	}

	stopRotation() {
		if (this.titleRotation === null) {
			return;
		}

		clearInterval(this.titleRotation);
		this.titleRotation = null;
	}

	_setTitle(title) {
		document.title = title;
	}
}

const speechHandler = new SpeechHandler();
const titleHandler = new TitleHandler();


export {
	setRoomsUnselectable,
	setNewRoomUnselectable,
	setRoomSelectable,
	startTimer,
	pulseAttackScreenGreen,
	pulseAttackScreenRed,
	updateJoinedUsers,
	setInviteCode,
	showCamera,
	abortCamera,
	closeMenu,
	hideAllWindows,
	showBg,
	hideBg,
	hideWaitingScreen,
	showHostWaitingScreen,
	showPlayerWaitingScreen,
	showDatabaseCheck,
	showRanking,
	showRules,
	showEnding,
	hideRoomSelection,
	enableCamera,
	enableCameraAbort,
	setElementData,
	getElementData,
	changeUrl,
	vibrate,
	speechHandler,
	titleHandler
};
