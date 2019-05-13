
import * as ui from "./ui.js";

//Tab-functionaliteit
$("#message-button").on("click", function(e) {
	e.preventDefault();
	ui.hideAllWindows();
	showMessages();
	ui.closeMenu();
	ui.showBg();
});

function showMessages() {
	//$("my").fadeIn();
	document.getElementById("my").style.display="block";
}

function hideMessages() {
	//$("my").fadeOut();
	document.getElementById("my").style.display="none";
}

export {
	showMessages,
	hideMessages
};
