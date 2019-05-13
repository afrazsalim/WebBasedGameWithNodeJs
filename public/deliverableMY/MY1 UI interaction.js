class UiInteraction{
  // arglist sendImageFunction: (img)
  // toekenning ID aan img en weten welke user heeft gestuurd is aan server gedeelte
  // arglist sendOpinionFunction: (type, imgID)
  // type = 'like' of 'dislike'
  constructor(sendImageFunction,sendOpinionFunction){
    const imgDivClass = "";
    const imgClass = "";
    const likeButtonClass = "";
    const dislikeButtonClass = "";
    const likeIDprefix = "like ";
    const dislikeIDprefix = "dislike ";
    const imgIDPrefix = "img ";
    const camButtonID = "";
    connectCameraButton();
    const sendImage = sendPhotoFunction;
    const sendOpinion = sendOpinionFunction;

    function connectCameraButton(){
      var cameraButton = document.getElementById(camButtonID);
      cameraButton.addEventListener('click', takePicture);
    }

    // neemt foto en stuurt door naar server
    function  takePicture(){

    }

    this.newQuestAlert = function(location){
      window.alert('New quest: go to ' + location);
    }

    // geeft melding weer dat een bepaalde locatie succesvol
    //veroverd is door de speler (id)
    this.succesfullCapture = function(id, location) {
      window.alert(id + " captured " + location + " succesfully!")
    };

    // maakt like en dislike buttons aan, koppelt EventListener
    function createButton(id, parentDiv, idPrefix,
        cssClass, connectedFunction){
      var button = document.createElement('button');
      button.setAttribute('class', cssClass);
      button.setAttribute('id', idPrefix + id);
      button.addEventListener("click", connectedFunction);
      parentDiv.appendChild(button);
    }

    // geeft afbeelding weer in HTML object met als id de gegeven
    //maakt ook like en dislike Buttons aan
    function showImage(img, id, parentDiv){
      var imgEl = document.createElement('IMG');
      imgEl.setAttribute('id', imgPrefix + ID);
      imgEl.setAttribute('class', imgClass);
      imgEl.src = img;
    }

    // ontvangt afbeelding en creert div om foto in weer te geven
    // creert ook buttons en img div (zie hulpfcties)
    this.receiveImage = function(img, imgID) {
      var div = document.createElement('div');
      div.setAttribute('id', ID);
      div.setAttribute('class', imgDivClass);
      createButton(id, div, likeIDprefix, likeButtonClass,
      function(){sendOpinion("like",id)});
      createButton(id, div, dislikeIDprefix, dislikeButtonClass,
      function(){sendOpinion("dislike",id)});
      function showImage(img, imgID)
    };

    this.removeImage = function(imgID){
      delete document.getElementById(likeIDprefix + imgID);
      delete document.getElementById(dislikeIDprefix + imgID);
      delete document.getElementById(imgIDPrefix + imgID);
      delete document.getElementById(imgID);
    }
  }
}
export default UiInteraction;
