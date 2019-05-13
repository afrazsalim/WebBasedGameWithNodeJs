/** GEOLOCATION.js
	This file holds the scripts and functions for the localizaton
	of the users.
*/
// import * as server from "./server_requests.js";

class Localization {
	constructor(pushPosToServerFunction, requestHandshakeFunction, user = "") {

		// formaat: [[x,y],accuracy]
		var userID = user;
		var userPos = null;
		var posChanged = false; // eslint-disable-line no-unused-vars
		// dictionary formaat
		var otherPlayersPos = {};
		var map = null;
		var that = this;
		var selectedPlayer = null;
		var accuracyCircle = null;
		// var userName = null;
		var updateTimer = null;
		var pushPosToServer = function() {pushPosToServerFunction(userPos);};
		var requestHandshake = function() {//console.log("handshake");
			requestHandshakeFunction(selectedPlayer);};
		const updateFrequency = 1000;
		const zoomToAmount = 3;
		const defaultZoom = 17;
		const geolocation = new ol.Geolocation({
			trackingOptions: {
				enableHighAccuracy: true
			},
		});
		this.isInit = false;
		//kaart initMap
		var mapImage =   [new ol.layer.Tile({source: new ol.source.OSM(),id: "map"})];
		var minZoom = 14;

		function updateuserPos() {
			var pos = geolocation.getPosition();
			if(userPos == null && pos != null) {
				setPos(pos, geolocation.getAccuracy());
				posChanged = true;
			}
			else if (pos != null) {
				//console.log("accuracy: "+ geolocation.getAccuracy());
				if(ol.sphere.getDistance(ol.proj.toLonLat(userPos[0]),pos) > geolocation.getAccuracy()) {
					setPos(pos, geolocation.getAccuracy());
					posChanged = true;
					// console.log("change");
					// console.log(pos);
				}
			}
		}

		function setPos(pos, accuracy) {
			//Mercatorprojectie
			userPos = [ol.proj.fromLonLat(pos), accuracy];

			if (map != null) {
				updateMarker("userMarker", userPos[0]);
				updateRadar();
			}
			pushPosToServer();
		}

		function updateMarker(id, pos) {
			//gebruiker
			var marker = map.getOverlayById(id);
			// var keys = Object.keys(otherPlayersPos);

			if (marker == null) {
				addMarker(pos, id, "otherPlayerMarker");
			}
			else {
				marker.setPosition(pos);
				restoreColours(marker.getElement());
			}
			if (selectedPlayer == id)
			{
				updateAccuracyIndicator(pos, otherPlayersPos[id][1]);
			}
			else if(selectedPlayer == null && id == "userMarker")
			{
				updateAccuracyIndicator(pos, userPos[1]);
			}
		}

		function updateAccuracyIndicator(pos, accuracy) {
			accuracyCircle.setCenter(pos);
			accuracyCircle.setRadius(correctRadius(pos, accuracy));
			// console.log(selectedPlayer);
			// console.log("accuracy");
			// console.log(accuracy);
		}

		function initAccuracyIndicator(pos, accuracy) {
			var vectorSource = new ol.source.Vector();
			accuracyCircle = new ol.geom.Circle(pos, correctRadius(pos, accuracy));
			vectorSource.addFeature(new ol.Feature(accuracyCircle));
			var vectorLayer = new ol.layer.Vector({source: vectorSource, map: map});
			// console.log("accuracy");
			// console.log(accuracy);
		}

		function correctRadius(pos, radius){
			return radius/Math.cos(ol.proj.toLonLat(pos)[1]/180*Math.PI);
		}

		function removeMarker(id) {
			if (selectedPlayer == id)
			{
				selectedPlayer = null;
				updateAccuracyIndicator(userPos[0], userPos[1]);
			}
			// console.log(id + " removed");
			elFadeOut(document.getElementById(id),
				function(){
					map.removeOverlay(map.getOverlayById(id));
					delete document.getElementById(id);
				}
			);
			playerRemovedMessage(id);
		}

		function playerRemovedMessage(id){
			var el = document.getElementById("log");
			el.innerHTML = id+ " has been removed from the game";
			elFadeIn(el);
			setTimeout(function(){elFadeOut(el);}, 1500);
		}

		function elFadeIn(el, duration = 500){
			el.style.visibility = "visible";
			el.animate([{opacity: "0"},{opacity: "1"}], duration);
		}

		function elFadeOut(el, callback = function(){}, duration = 500){
			el.animate([{opacity: "1"},{opacity: "0"}],duration+15);
			setTimeout(function(){
				el.style.visibility="hidden";
				callback();
			}, duration);
		}

		function autoZoom() {
			if(Object.keys(otherPlayersPos).length === 0) {
				map.getView().animate({center: userPos[0],zoom:defaultZoom, duration: 300});
			}
			else {
				var nearest = findNearestOpponents();
				nearest.push(userPos[0]);
				var ext = ol.extent.boundingExtent(nearest);
				map.getView().fit(ext,{duration:300, maxZoom: defaultZoom});
			}
		}

		function findNearestOpponents() {
			if (otherPlayersPos == null) {
				return [];
			}
			var nearest = [];
			var keys = Object.keys(otherPlayersPos);
			for (var i in keys) {
				if(nearest.length < zoomToAmount) {
					nearest.push(otherPlayersPos[keys[i]][0]);
				}
				else {
					for (var k = 0; k<nearest.length; k++) {
						if (distanceBetween(otherPlayersPos[keys[i]][0],userPos[0])
							< distanceBetween(nearest[k],userPos[0])) {
							nearest[k] = otherPlayersPos[keys[i]][0];
							break;
						}
					}
				}
			}
			return nearest;
		}

		function distanceBetween(pt1, pt2) {
			return Math.sqrt(Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2));
		}

		function getScale() {
			var extent = map.getView().calculateExtent(map.getSize());
			var topLeft = ol.proj.toLonLat(ol.extent.getTopLeft(extent));
			//var topRight = ol.proj.toLonLat(ol.extent.getTopRight(extent));
			var bottomLeft = ol.proj.toLonLat(ol.extent.getBottomLeft(extent));

			//var width = ol.sphere.getDistance(topLeft,topRight);
			var height = ol.sphere.getDistance(topLeft,bottomLeft);

			var div = document.getElementById("map");
			//console.log(width/ div.offsetWidth);
			return height / div.offsetHeight; //in meter per pixel
		}

		function centerMap() {
			map.getView().animate({center: userPos[0], duration: 300});
		}

		function selectPlayer(name) {
			if(name == selectedPlayer) {
				document.getElementById(name+"popup").classList.toggle("show");
				selectedPlayer = null;
				updateAccuracyIndicator(userPos[0],userPos[1]);
			}
			else if (selectedPlayer != null) {
				document.getElementById(selectedPlayer+"popup").classList.toggle("show");
				document.getElementById(name+"popup").classList.toggle("show");
				selectedPlayer = name;
				updateAccuracyIndicator(otherPlayersPos[name][0],otherPlayersPos[name][1]);
			}
			else {
				document.getElementById(name+"popup").classList.toggle("show");
				selectedPlayer = name;
				updateAccuracyIndicator(otherPlayersPos[name][0],otherPlayersPos[name][1]);
			}
		}

		function addPopup(name) {
			var popup = document.createElement("div");
			popup.setAttribute("id", name+"popup");
			popup.setAttribute("class", "popup");
			document.getElementById(name).appendChild(popup);
			popup.innerHTML = name;
			popup.addEventListener("click", function() {requestHandshake(name);});
		}



		function addMarker(pos, id, type) {
			// nieuw html object voor marker
			var marker = document.createElement("div");
			marker.setAttribute("id",id);
			marker.setAttribute("class", type);
			marker.style.opacity = 1;
			if(type == "otherPlayerMarker"){
				marker.addEventListener("click", function() {selectPlayer(marker.id);});
			}
			document.body.appendChild(marker);
			addPopup(id);
			// console.log(marker);
			var stopEvent = (type == "otherPlayerMarker");
			map.addOverlay(
				new ol.Overlay({
					position: pos,
					positioning: "center-center",
					element: marker,
					stopEvent: stopEvent,
					id: id
				})
			);
			elFadeIn(marker);
		}

		function initMap() {
			map = new ol.Map({
				target: "map",
				controls: [],
				layers: mapImage,
				view: new ol.View({
					center: userPos[0],
					zoom:defaultZoom,
					minZoom: minZoom
				}),
				interactions: ol.interaction.defaults({
					onFocusOnly: false,
					dragPan: true,
					doubleClickZoom: false
				})
			});
			// console.log(map.getView().getCenter());
			// markers
			addMarker(userPos[0],"userMarker", "marker");
			initAccuracyIndicator(userPos[0], userPos[1]);
			initRadar();
			if (otherPlayersPos != null) {
				var keys = Object.keys(otherPlayersPos);
				for(var id in keys) {
					addMarker(otherPlayersPos[keys[id]], keys[id], "otherPlayerMarker");
				}
			}
			autoZoom();
			// interactions
			map.on("singleclick", centerMap);
			map.on("dblclick", autoZoom);
			map.on("moveend", updateRadar);
		}

		function initRadar() {
			var div = document.getElementById("map");
			var size = Math.min(div.offsetWidth,div.offsetHeight);
			var scale = getScale();

			for (var i=1; i<=5;i++) {
				var pxSize = size*(i)/(5);
				addCircle(userPos[0], pxSize, "radar"+i);
				document.getElementById("radar"+i).innerHTML = Math.round(pxSize/2*scale)+"m";
			}
		}

		function addCircle(pos, size, id) {
			// var div = document.getElementById("map");
			var circle = document.createElement("div");
			circle.setAttribute("class", "circle");
			circle.setAttribute("id", id);

			circle.style.height = size+"px";
			circle.style.width = size+"px";
			document.body.appendChild(circle);

			map.addOverlay(
				new ol.Overlay({
					position: pos,
					positioning: "center-center",
					element: circle,
					id: id,
					stopEvent:false
				})
			);
		}

		function updateRadar() {
			var scale = getScale();
			var circle = null;
			for (var i=1; i<=5;i++) {
				var id = "radar"+i;
				circle = document.getElementById(id);
				circle.innerHTML = Math.round((circle.offsetWidth/2)*scale)+"m";
				map.getOverlayById(id).setPosition(userPos[0]);
			}
		}

		//update de map en eigen positie, NIET die van andere spelers
		function update() {
			updateuserPos();
			fadeColours();
		}

		function fadeColours(){
			var keys = Object.keys(otherPlayersPos);
			keys.push("userMarker");
			for (var i in keys) {
				if (document.getElementById(keys[i]).style.opacity > "0.4"){
					document.getElementById(keys[i]).style.opacity =
						String(parseFloat(document.getElementById(keys[i]).style.opacity)-0.05);
				}
			}
		}

		function restoreColours(el){
			el.style.opacity = "1";
		}

		this.startTracking = function() {
			geolocation.setTracking(true);
			updateuserPos();
		};

		//initialiseert object (tracking en map)
		this.init = function() {
			var timer = setInterval(function() {
				updateuserPos();
				//that.updateOtherPos();
				if(userPos!= null) {
					initMap();
					clearInterval(timer);
					that.isInit = true;
					updateTimer = setInterval(update, updateFrequency);
				}
			}, 1000);
		};
		// gebruik om posities andere spelers up te daten
		// formaat: {speler1:[x,y, accuracy], speler2:[x,y, accuracy], ...}
		this.updateOtherPos = function(id, pos) {
		// console.log('update positions was called in gelocation', id , pos);
			if (id == userID){
				return;
			}
			if (pos != null) {
				otherPlayersPos[id]= pos;
				updateMarker(id, pos[0]);
			}
			else {
				delete otherPlayersPos[id];
				removeMarker(id);
			}
		};
		//returnt eigen positie
		this.getOwnPos = function() {
			posChanged = false;
			return userPos;
		};

		//stopt locatiebepaling
		this.stop= function(){
			geolocation.setTracking(false);
			clearInterval(updateTimer);
		};
		//voert handshake uit eens bevestigd
		this.shakeHands = function(id) {
			document.getElementById(id).setAttribute("class", "handshakeMarker");
			window.alert("you shook hands with "+id);
		};

		// berekent nodige updatefrequentie
		this.getUpdateFrequency = function() {
			if(geolocation.getSpeed() != undefined
				&& geolocation.getAccuracy()!= undefined) {
				return geolocation.getAccuracy()/geolocation.getSpeed();
			}
			return updateFrequency;
		};
	}
}

export default Localization;
