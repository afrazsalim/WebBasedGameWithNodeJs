$(function() {
	$("#form .signup").hide();

	// Remove autofilled values
	setTimeout(function() {
		$("input").each(function(key, value) {
			let current_input = $(value);

			if (current_input.val() != "") {
				current_input.val("");
				current_input.removeClass("has-content");
			}
		});
	}, 250);

	let flashMessage = localStorage.getItem("flashMessage");

	if (flashMessage != null) {
		// console.log(flashMessage);
		$("#flashMessage")
			.css("display", "unset")
			.hide()
			.html(flashMessage)
			.slideDown();

		setTimeout(function() {
			$("#flashMessage").slideUp();
		}, 5000);

		localStorage.removeItem("flashMessage");
	}

	animateEntrance();
});

function animateEntrance() {
	const offsetClass = ($(window).width() < 950) ? "left-5-percent" : "left-8-percent";

	if (! $("#form").hasClass(offsetClass)) {
		$("#form")
			.removeClass()
			.addClass(offsetClass);

		if ($("#form #tabs .game-title").css("visibility") == "hidden") {
			setTimeout(function() {
				$("#form #tabs .game-title")
					.css("visibility", "unset")
					.hide()
					.fadeIn(1500);
			}, 300);
		}
	}

	if (! $("#background-wolf").hasClass("right-0")) {
		$("#background-wolf").addClass("right-0");
	}
}

$(window).on("resize", animateEntrance);

$("input").focusout(function() {
	const input_val_length = $(this).val().length;

	if (input_val_length === 0) {
		$(this).removeClass("has-content");
	} else {
		$(this).addClass("has-content");
	}
});

$("#switch-to-login-button").on("click", function(e) {
	e.preventDefault();

	$("#tabs .signup").fadeOut(500, function() {
		$("#tabs .login").fadeIn(300);

		$("#signup-errors").removeClass("show-errors");
		$("#signup-form input[name=username]").val("").removeClass("has-content");
		$("#signup-form input[name=password]").val("").removeClass("has-content");


		$("#signup-errors").removeClass("show-errors");
		emptySignupFields();
	});
});

$("#switch-to-signup-button").on("click", function(e) {
	e.preventDefault();

	$("#tabs .login").fadeOut(500, function() {
		$("#tabs .signup").fadeIn(300);

		$("#login-errors").removeClass("show-errors");
		emptyLoginFields();
	});
});

$("form#login-form").on("submit", function(e) {
	e.preventDefault();

	var data = {
		username: $("form#login-form input#username").val().trim(),
		password: $("form#login-form input#password").val().trim()
	};

	sendDataBeforeLoginOrSignUp("/login", "POST", data, logInSucces);
});

$("form#signup-form").on("submit", function(e) {
	e.preventDefault();

	var data = {
		username: $("form#signup-form input[name=username]").val().trim(),
		password: $("form#signup-form input[name=password]").val().trim()
	};

	sendDataBeforeLoginOrSignUp("/sign-up", "POST", data, signUpSucces);
});

function signUpSucces(tokens, data) {
	sessionStorage.setItem("token", tokens);
	sessionStorage.setItem("roomsTaken", data.roomsTaken);
	sessionStorage.setItem("data", (data.privUser === null) ? null : true);
	sessionStorage.setItem("gameStarted", data.gameStarted);

	exitScreen();

	setTimeout(function() {
		window.location.href = "./homepage.html?forceAddImage"; // => ./room.html
	}, 500);
}

function logInSucces(tokens, data) {
	sessionStorage.setItem("token", tokens);
	sessionStorage.setItem("roomsTaken", data.roomsTaken);
	sessionStorage.setItem("data", (data.privUser === null) ? null : true);
	sessionStorage.setItem("gameStarted", data.gameStarted);

	exitScreen();

	setTimeout(function() {
		window.location.href = "./homepage.html";
	}, 500);
}

function sendDataBeforeLoginOrSignUp(adress, method, data, callbackFunction) {
	$.ajax({
		url: adress,
		method: method,
		data: JSON.stringify(data),
		contentType: "application/json",
		success: function(data, statusCode, request) {
			callbackFunction(request.getResponseHeader("x-auth"), data);
		},
		error: function(jqXHR, textStatus, errorThrown) { // eslint-disable-line no-unused-vars
			const response = JSON.parse(jqXHR.responseText);

			let listItem = document.createElement("li");
			listItem.innerHTML = response["message"];

			if (response["recipient"] == null) {
				let recipient = null;

				if (adress === "/login") {
					recipient = $("#login-errors ul");
				} else {
					recipient = $("#signup-errors ul");
				}

				recipient.empty()
					.append(listItem)
					.parent()
					.addClass("show-errors");

				emptySignupFields();
				emptyLoginFields();
			}

			// pass error to error-parsing...
		}
	});
}

function exitScreen() {
	$("#form").removeClass("left-5-percent")
		.removeClass("left-8-percent");
	$("#background-wolf").removeClass("right-0");
}

function emptySignupFields() {
	$("#signup-form input[name=username]").val("").removeClass("has-content");
	$("#signup-form input[name=password]").val("").removeClass("has-content");
}

function emptyLoginFields() {
	$("#login-form input[name=username]").val("").removeClass("has-content");
	$("#login-form input[name=password]").val("").removeClass("has-content");
}

var input1 = document.getElementById("signed");
var input2 = document.getElementById("signedup");
var input3 = document.getElementById("username");
var input4 = document.getElementById("password");

var text = document.getElementById("capslock");

input1.addEventListener("keyup",function(event){
	if (typeof event.getModifierState === "undefined") {
		return;
	}

	if (event.getModifierState("CapsLock")) {text.style.display="block";}
	else {text.style.display="none";}
});

input2.addEventListener("keyup",function(event){
	if (typeof event.getModifierState === "undefined") {
		return;
	}

	if (event.getModifierState("CapsLock")) {text.style.display="block";}
	else {text.style.display="none";}
});

input3.addEventListener("keyup",function(event){
	if (typeof event.getModifierState === "undefined") {
		return;
	}

	if (event.getModifierState("CapsLock")) {text.style.display="block";}
	else {text.style.display="none";}
});

input4.addEventListener("keyup",function(event){
	if (typeof event.getModifierState === "undefined") {
		return;
	}

	if (event.getModifierState("CapsLock")) {text.style.display="block";}
	else {text.style.display="none";}
});

$("#signup-form .open-policy").on("click", function(e) {
	e.preventDefault();

	$("#policy").css("display", "unset").hide().fadeIn();
});

$("#policy .close").on("click", function(e) {
	e.preventDefault();

	$(this).parent().fadeOut();
});

/* Move Copyright if necessary */
if (document.getElementById("tabs").getBoundingClientRect().bottom >= (document.getElementById("copyright").getBoundingClientRect().bottom+405)) {
	document.getElementById("copyright").style.position="relative";
}
/*
if (document.getElementById("switch-to-login-button").getBoundingClientRect().bottom>= document.getElementById("copyright").getBoundingClientRect().bottom) {
		document.getElementById("copyright").style.position="relative";
}
*/
