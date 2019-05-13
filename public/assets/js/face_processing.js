/** FACE_PROCESSING.js
	This file holds the scripts and functions for detecting and
	processing faces.
*/
import * as ui from "./ui.js";


const MODEL_URL = "./assets/weights/";


async function getDescriptors(image, canvas) {
	const minConfidence = 0.6;
	const fullFaceDescriptions = await faceapi.allFacesTinyYolov2(image, minConfidence);
	const detectionsForSize = fullFaceDescriptions.map(det => det.forSize(image.width, image.height));

	canvas.width = image.width;
	canvas.height = image.height;

	canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

	if (fullFaceDescriptions.length === 0) {
		return null;
	}

	let max_area = 0;
	let descriptor = null;

	detectionsForSize.forEach(fd => {
		let area = fd.detection["box"]["area"];

		if (area > max_area) {
			max_area = area;
			descriptor = fd.descriptor;
		}

		faceapi.drawDetection(canvas, fd.detection, { withScore: false });
	});

	return descriptor;
}

async function load_models() {
	console.time("Loading models took");

	await faceapi.loadFaceLandmarkModel(MODEL_URL);
	await faceapi.loadFaceRecognitionModel(MODEL_URL);
	await faceapi.loadTinyYolov2Model(MODEL_URL);

	console.timeEnd("Loading models took");
	ui.enableCamera();
}

load_models();

export {
	getDescriptors
};
