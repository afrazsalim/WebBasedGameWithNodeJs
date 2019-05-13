import * as face_processing from "./face_processing.js";
import * as server from "./server_requests.js";
import * as ui from "./ui.js";

const img = document.querySelector("#camera img#snap");
const canvas = document.createElement("canvas"); // Be carefull with this one (aka only remove with care)
const devices = {
	"front": null,
	"rear": null
};

navigator.mediaDevices.enumerateDevices()
	// .then(checkPermission)
	.then(gotDevices)
	.then(checkForcedAddImage)
	.catch(handleError);

function gotDevices(foundDevices) {
	if (foundDevices.length === 1) {
		devices["front"] = foundDevices[0].deviceId;
		return;
	}

	foundDevices.forEach(function(device) {
		if (device.kind !== "videoinput") {
			return;
		}

		const deviceLabel = device.label.toLowerCase();
		const deviceId = device.deviceId;

		if (deviceLabel.includes("webcam") || deviceLabel.includes("front")) {
			devices["front"] = deviceId;
		} else if (deviceLabel.includes("back")) {
			devices["rear"] = deviceId;
		} else if (devices["front"] == null) {
			// Only fallback to other devices if no verified
			//  front device has been found
			devices["front"] = deviceId;
		} else if (devices["rear"] == null) {
			devices["rear"] = deviceId;
		}
	});
}

function checkForcedAddImage() {
	if (window.location.search.indexOf("forceAddImage") == -1) {
		enableCameraAbort();
		return;
	}

	setAction("add-image");

	startCamera("front");
	showCamera();
}

function setAction(actionType) {
	setElementData("#camera", "action", actionType);
}

function getAction() {
	return getElementData("#camera", "action");
}

function getNumberOfAvailableDevices() {
	return (devices["front"] != null) + (devices["rear"] != null);
}

function startCamera(preferredDevice="front") {
	if (!hasGetUserMedia()) {
		alert("Please allow camera access to play the game!");
		return;
	}

	const deviceId = getPreferredDeviceId(preferredDevice);

	if (deviceId == null) {
		alert("cannot switch camera");
		return;
	}

	const otherCamera = getOtherCameraOption(preferredDevice);

	stopCamera();

	const constraints = {
		video: {
			deviceId: {exact: deviceId}
		}
	};

	$("#switch-camera i").html("camera_" + otherCamera);
	$("#switch-camera").data("next-camera", otherCamera);

	//ui.titleHandler.setSingleTitle("Take a picture");

	startStream(constraints, setStream, handleError);
}

function hasGetUserMedia() {
	return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function getPreferredDeviceId(preferred) {
	if (!Object.keys(devices).includes(preferred)) {
		console.error("Must select front or rear camera");
		return false;
	}

	if (devices[preferred] != null) {
		return devices[preferred];
	}

	// Be aware: may be null
	return devices[getOtherCameraOption(preferred)];
}

function getOtherCameraOption(currentOption) {
	const options = Object.keys(devices);

	// Remove current from options,
	//  in case of preferred not available
	//  fallback to this new array with alternatives
	options.splice(options.indexOf(currentOption), 1);

	return options[0];
}

function stopCamera() {
	if (window.stream) {
		window.stream.getTracks().forEach(function(track) {
			track.stop();
		});
	}
}

function startStream(constraints, callback, errorCallback) {
	navigator.mediaDevices.getUserMedia(constraints)
		.then(callback).catch(errorCallback);
}

function showCamera() {
	if (getNumberOfAvailableDevices() > 1) {
		$("#switch-camera").removeClass("inactive");
	}

	var cameraWrapper = $("#camera");

	cameraWrapper.css("z-index", "100");
	cameraWrapper.fadeIn(250);

	hideCameraError();
}

function setStream(stream) {
	window.stream = stream; // make stream available to console
	document.querySelector("video").srcObject = stream;
}

function handleError(error) {
	console.error("Error: ", error);
}

function showImage() {
	// Set display to block and hide to trick jQuery into fading to display block
	let image = $("#camera #snap").css("display", "block").hide();
	let video = document.querySelector("video");


	ui.titleHandler.setSingleTitle("Verify your picture");

	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	canvas.getContext("2d").drawImage(video, 0, 0);

	// Other browsers will fall back to image/png
	image.attr("src", canvas.toDataURL("image/webp"));
	image.fadeIn();

	$("#accept-camera i").html("check");
	$("#switch-camera i").html("delete")
		.parent()
		.removeClass("inactive")
		.addClass("red");

	stopCamera();
}

function showCameraError(error) {
	ui.vibrate(200);

	hideCameraError(function() {
		$("#camera #error-message .text")
			.html(error)
			.parent()
			.slideDown();

		setTimeout(function() {
			$("#camera #error-message").slideUp();
		}, 5000);
	});
}

function hideCameraError(callback=null) {
	if (callback != null) {
		$("#camera #error-message").slideUp(callback);
	} else {
		$("#camera #error-message").hide();
	}
}

function showLoading(callback) {
	if (callback !== undefined) {
		$("#loading").fadeIn(callback);
	} else {
		$("#loading").fadeIn();
	}
}

function hideLoading() {
	$("#loading").fadeOut();
}

function abortImage(restartCamera=true) {
	let image = $("#camera #snap");

	const switch_btn = $("#switch-camera");
	const otherCamera = switch_btn.data("next-camera");
	const currentCamera = getOtherCameraOption(otherCamera);

	if (restartCamera) {
		startCamera(currentCamera);
	}

	switch_btn.find("i").html("camera_" + otherCamera)
		.parent()
		.removeClass("red");

	if (getNumberOfAvailableDevices() <= 1) {
		switch_btn.addClass("inactive");
	}

	$("#accept-camera i").html("photo_camera");

	image.fadeOut();
	$("#camera canvas").fadeOut();
}

$("#camera-button2").on("click", function(e) {
	e.preventDefault();
	console.log("camera button 2 worked");

	if (getNumberOfAvailableDevices() > 1) {
		$("#switch-camera").removeClass("inactive");
	}

	setAction("camera");

	startCamera("rear");
	showCamera();
});

$("#accept-camera").on("click", async function(e) {
	e.preventDefault();
	console.log('hier2');
	console.log(img);
	if (img.style.display == "block") {
		showLoading(async function() {
			let descriptor = null;

			try {
				descriptor = await face_processing.getDescriptors(img, document.querySelector("canvas"));
			} catch (exception) {
				// OK, I know that this is an extremely dirty trick, but it works, so it'll do for now.
				try {
					descriptor = await face_processing.getDescriptors(img, document.querySelector("canvas"));
				} catch (exception_two) {
					console.error(exception);
					hideLoading();
					showCameraError("Unknown error, try again please!");
					abortImage();
					return;
				}
			}

			$("#camera canvas").fadeIn();

			if (descriptor != null) {
				if (getAction() == "add-image") {
					server.addFace(descriptor);

					ui.enableCameraAbort();
					ui.changeUrl("/homepage.html");

					abortCamera();
					stopCamera();
				} else if (getAction() == "check-image") {
					server.checkFace(descriptor);

					abortCamera();
					stopCamera();
				} else {
					server.attack(descriptor);

					abortCamera();
					stopCamera();
				}
			} else {
				showCameraError("No face found, try again.");
				abortImage();
			}
		});

		hideLoading();

		return;
	}

	showImage();
});

$("#checkButton").on("click", function(e) {
	e.preventDefault();

	if (getNumberOfAvailableDevices() > 1) {
		$("#switch-camera").removeClass("inactive");
	}

	setAction("check-image");

	startCamera("front");
	showCamera();
});

$("#switch-camera").on("click", function(e) {
	e.preventDefault();

	if (img.style.display == "block") {
		abortImage();
		return;
	}

	if (getNumberOfAvailableDevices() <= 1) {
		showCameraError("Cannot change camera: not enough sources found.");
		return;
	}

	const nextCamera = $(this).data("next-camera") || "front";
	const otherCamera = getOtherCameraOption(nextCamera);

	startCamera(nextCamera);
	$(this).find("i").html("camera_" + otherCamera);
	$(this).data("next-camera", otherCamera);
});

$("#abort-camera").on("click", function(e) {
	e.preventDefault();

	abortCamera();
	stopCamera();
});

function abortCamera() {
	var cameraWrapper = $("#camera");

	cameraWrapper.fadeOut(250);
	cameraWrapper.css("z-index", "-1");
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
