function missionSelect () {
	var random = Math.floor(Math.random()*3); //return random integer from 0 to 3
	random = 0;
	var mission = document.getElementById("mission_loc");
	switch(random){
		case 0:
			mission.innerHTML="Arenberg Castle";
			break;
		case 1:
			mission.innerHTML="";
			break;
		case 2:
			mission.innerHTML="";
			break;
	}

}
