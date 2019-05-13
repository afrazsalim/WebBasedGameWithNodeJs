/** UI_ACTIONS.js
	This file holds the scripts and functions for the UI that do need
	interaction with other services (e.g. the server).
*/

import * as server from "./server_requests.js";
import * as camera from "./camera.js";
import * as ui from "./ui.js";


$("#menu-toggle").on("click", function(e) {
	e.preventDefault();

	$(this).toggleClass("active");
	$("#menu").toggleClass("show");
});

$("#database-button").on("click", function(e) {
	e.preventDefault();

	ui.hideAllWindows();
	ui.showDatabaseCheck();
	ui.closeMenu();
	ui.showBg();
});

$("#ranking-button").on("click", function(e) {
	e.preventDefault();

	ui.hideAllWindows();
	ui.showRanking();
	ui.closeMenu();
	ui.showBg();
});

$("#rules-button").on("click", function(e) {
	e.preventDefault();

	ui.hideAllWindows();
	ui.showRules();
	ui.closeMenu();
	ui.showBg();
});

$("#updateFreq").on("input", function() {
	$("#updateFreqNumber").html($(this).val());
});

$("#updateFreq").on("change", function() {
	server.updateFrequency($(this).val());
});

let speechCommandTimer = null;

$("#speech-button").on("click", function(e) {
	let container = $(this).parent();

	e.preventDefault();

	ui.vibrate(50);

	if (container.hasClass("speak")) {
		$("#speech-abort").click();
		return;
	}

	if (speechCommandTimer != null) {
		clearTimeout(speechCommandTimer);
	}

	$("#speech-container #progress-bar").removeClass("run");
	$(this).find("i").html("hearing");
	$(this).parent().addClass("speak");

	ui.speechHandler.start(showSpeechResults);
});

$("#speech-abort").on("click", function(e) {
	e.preventDefault();

	ui.speechHandler.stop();

	if (speechCommandTimer != null) {
		clearTimeout(speechCommandTimer);
	}

	$(this)
		.parent().removeClass("result").removeClass("speak")
		.find("#speech-button i").html("mic");

	$("#speech-container #progress-bar").removeClass("run");
});

function showSpeechResults(result) {
	let container = $("#speech-container");
	let button = $("#speech-button");
	let abort = $("#speech-abort");
	let result_div = $("#speech-result");

	container.removeClass("speak");
	button.find("i").html("mic");

	if (result == null) {
		ui.vibrate(200);
		return;
	}

	result = result[0][0].transcript;

	container.addClass("result");

	abort.hide().fadeIn(400);
	result_div.html(result).hide().fadeIn(400);

	$("#speech-container #progress-bar").addClass("run");

	speechCommandTimer = setTimeout(() => {
		processSpeechCommand(result);
	}, 3000);
}

function processSpeechCommand(command) {
	$("#speech-abort").click();

	let commands = {
		"rules": [openRules, null],
		"camera": [openCamera, ["front", "rear"]],
	};

	for (var cmd in commands) {
		if (! command.includes(cmd)) {
			continue;
		}

		let func = commands[cmd][0];
		let params = commands[cmd][1];

		if (params === null) {
			func();
			break;
		}

		let foundParam = params[0];

		for (var param in params) {
			param = params[param];

			if (! command.includes(param)) {
				continue;
			}

			foundParam = param;
			break;
		}

		func(foundParam);
		break;
	}

	// console.log("processing command:", command);
}

function openRules() {
	ui.showBg();
	ui.showRules();
}

function openCamera(side=null) {
	camera.setAction("camera");
	// console.log(side);

	if (side === null) {
		camera.startCamera();
	} else {
		camera.startCamera(side);
	}

	camera.showCamera();
}

function visibilityChange() {
	if (sessionStorage.getItem("gameStarted") == "true") {
		if (document["webkitHidden"] === true) {
			ui.titleHandler.setTitles("Game ends on 1 minute of inactivity!");
			server.logInactivity();
		} else {
			ui.titleHandler.setDefaultTitle();
			server.logActivity();
		}
	}

	if (document["webkitHidden"] === true) {
		$("#leave-warning").css("display", "unset").show();
	} else {
		$("#leave-warning").hide();
	}
}

document.addEventListener("webkitvisibilitychange", visibilityChange);

$("#room-selection-screen .room-selections .option").on("click", function(e) {
	e.preventDefault();

	$("#room-selection-screen .room-selections .option").each(function(key, element) {
		$(element).removeClass("selected");
	});

	$(this).addClass("selected");
});

$("#select-room").on("click", function(e) {
	e.preventDefault();

	let selectedOption = $("#room-selection-screen .option.selected");
	let roomName = selectedOption.data("room-name");

	if (roomName == "invite") {
		// console.log("Working on the client side");
		roomName = selectedOption.find("input").val();
		server.sendInvitation(roomName);
	} else if (roomName == "create") {
		//Andere functie
	} else {
		server.selectRoom(roomName);
	}
});

$("#timeInput").on("keyup", function() {
	let timeField = $(this);
	let value = timeField.val();

	value = value.replace(/[^0-9:]/g, "");

	if (value.length > 2) {
		let first = value.substr(0, 2);
		let second = value.substr(2);

		second = second.replace(/:/g, "");

		if (parseInt(first) < 10) {
			first = "10";
		}

		if (second != "" && parseInt(second) > 59) {
			second = "59";
		}

		value = first + ":" + second;
	}

	if (value.length > 5) {
		value = value.substring(0, 5);
	}

	timeField.val(value);
});

$("#user-table").on("click", ".remove-user-from-room", function(e) {
	e.preventDefault();

	server.removeUserFromRoom($(this).data("username"));
});

$(window).on("beforeunload", function() {
	sessionStorage.clear();
	//localStorage.setItem("flashMessage", "Reloading results in logout as the rules dictate");
});
