document.getElementById("save_new_exercise").onclick = function(e) {
  window.userHistory = window.userHistory || {};
  var newuser = {};
  newuser.userid = window.userHistory.id;
  newuser.dateCreated = JSON.stringify(new Date());
  newuser.nameAudio = document.getElementById("audio_response_file").src;
  newuser.gravatar = document.getElementById("user_image_file").src;
  newuser.firstName = document.getElementById("user_audio_name_transcription").value;
  newuser.languages = [];
  $(".language_item").each(function(e){
    var newlang = {};
    newlang.name  = $(this).find(".language_name").html();
    newlang.acquisitonType = [];
    var acqs  = $(this).find(".acquisition_type");
    for(var t = 0; t < acqs.length; t++){
      newlang.acquisitonType.push(acqs[t].innerHTML);
    }
    newuser.languages.push(newlang);
  });
  OPrime.debug(JSON.stringify(newuser));
  window.userHistory.userProfile = window.userHistory.userProfile || [];
  window.userHistory.userProfile.unshift(newuser);
  window.userHistory.userid = newuser.userid;
  alert("I saved your user to localstorage as JSON (normally I would put it in a database, but this is just a clickable prototype): "
      + JSON.stringify(newuser));
};

document.getElementById("users_langauges_textarea").onblur = function(e) {
  var languages = e.target.value.split(",");
  var langList = $("#users_languages");
  langList.html("");
  for ( var l in languages) {
    langList.append('<li class="language_item"><span class="language_name">' + languages[l].trim()
        + '</span>: <div class="alert alert-info "> '
        + '<button type="button" class="close" data-dismiss="alert">×</button>'
        + ' <span class="acquisition_type">Immersion</span> </div> <div class="alert alert-info ">'
        + '<button type="button" class="close" data-dismiss="alert">×</button>'
        + ' <span class="acquisition_type">Studied</span </div></li>');
  }
};

document.getElementById("capture_user_image_button").onclick = function(e) {
  e.stopPropagation();
  var responsefilename = document
      .getElementById("user_audio_name_transcription").value
      .replace(/\W/g, "_")
      + "_stimuli_" + Date.now() + ".png";
  OPrime.capturePhoto(responsefilename, /* started */null, /* completed */
  function(imageUrl) {
    OPrime.debug("\nPicture capture successfully completed " + imageUrl);
    document.getElementById("user_image_file").src = imageUrl;
  });
};

/*
 * Hide HTML5 audio controls on Android
 */
if (!OPrime.isAndroidApp()) {

  document.getElementById("audio_response_file").setAttribute("controls",
      "controls");
}

/*
 * Handle the record/stop response button
 */
document.getElementById("record_vocab_response_button").onclick = function(e) {
  e.stopPropagation();
  var responsefilename = document
      .getElementById("user_audio_name_transcription").value
      .replace(/\W/g, "_")
      + "_stimuli_" + Date.now() + ".mp3";
  if (document.getElementById("record_vocab_response_button").classList
      .toString().indexOf("icon-stop") == -1) {
    OPrime.captureAudio(responsefilename, /* started */function(audioUrl) {
      OPrime.debug("\nRecording successfully started " + audioUrl);

      // Only change the icons once.
      if (document.getElementById("record_vocab_response_button").classList
          .toString().indexOf("icon-record") > -1) {
        $(document.getElementById("record_vocab_response_button")).toggleClass(
            "icon-record icon-stop");// set class to stop
        $(document.getElementById("record_vocab_response_button")).html("");
      }

    }, /* Recording complete */function(audioUrl) {
      OPrime.debug("Attaching sucessful recording to the result audio div "
          + audioUrl);
      document.getElementById("audio_response_file").src = audioUrl;
      document.getElementById("record_vocab_response_button").removeAttribute(
          "disabled", "disabled");
      // Play recorded audio
      OPrime.playAudioFile('audio_response_file');
    });
  } else {
    document.getElementById("record_vocab_response_button").setAttribute(
        "disabled", "disabled");
    OPrime.stopAndSaveAudio(responsefilename, /* stopped */function(audioUrl) {
      if (document.getElementById("record_vocab_response_button").classList
          .toString().indexOf("icon-stop") > -1) {
        $(document.getElementById("record_vocab_response_button")).toggleClass(
            "icon-stop icon-record");// set class to record
        $(document.getElementById("record_vocab_response_button")).html(
            '<img src="mic_white.png" />');
      }

      OPrime.debug("\nRecording successfully stopped " + audioUrl);
    });
  }
};

/*
 * Handle the play response button
 */
document.getElementById("play_response_button").onclick = function(e) {
  OPrime.playAudioFile('audio_response_file');
};

/*
 * Capturing user's play back of audio, and saving it and restoring it from
 * localstorage
 */
var userHistory = localStorage.getItem("userHistory");
if (userHistory) {
  userHistory = JSON.parse(userHistory);
  OPrime.debug("Welcome back userid " + userHistory.id);
} else {
  userHistory = {};
  userHistory.id = Date.now();
}
OPrime.hub.subscribe("playbackCompleted", function(filename) {
  window.userHistory[filename] = window.userHistory[filename] || [];
  window.userHistory[filename].push(JSON.stringify(new Date()));
  window.saveUser();
}, userHistory);

window.saveUser = function() {
  localStorage.setItem("userHistory", JSON.stringify(window.userHistory));
  OPrime.debug(JSON.stringify(window.userHistory));
};

// Android WebView is not calling the onbeforeunload to save the userHistory.
window.onbeforeunload = window.saveUser;