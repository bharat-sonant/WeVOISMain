// create Agora client
var client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

var localTracks = {
    videoTrack: null,
    audioTrack: null
};
var remoteUsers = {};
// Agora client options
var options = {
    appid: null,
    channel: null,
    uid: null,
    token: null,
    role: "audience", // host or audience
    audienceLatency: 2
};

//options.appid = "158847a4256b48c2a9c5489a3f059cb4";
//options.token = "007eJxTYIjZbfjjwpWnch4soSJHQzO3+P3/rZA090lksKqua4f0VF0FBkNTCwsT80QTI1OzJBOLZKNEy2RTEwvLROM0A1PL5CSTJ8tXJTcEMjLEzDdnYmSAQBCfmSGjOJmBAQDreR36";
//options.channel = "hsc";
//join();



let request = new XMLHttpRequest();
request.open("POST", "https://us-central1-dsiapp-103c4.cloudfunctions.net/getCurrentChannel");
request.send();
request.onload = () => {
    if (request.status == 200) {
        var channelName = JSON.parse(request.response);
        console.log(channelName);
        let tokenRequest = new XMLHttpRequest();
        tokenRequest.open("POST", "https://us-central1-dsiapp-103c4.cloudfunctions.net/getChannelToken", true);
        tokenRequest.setRequestHeader("Content-Type", "application/json");
        tokenRequest.onreadystatechange = function() {
            if (tokenRequest.readyState === 4 && tokenRequest.status === 200) {
                var json = JSON.parse(tokenRequest.response);
                options.appid = json["appId"];
                options.token = json["token"];
                options.channel = channelName + "";
            }
        };
        var data = JSON.stringify({ "channelName": channelName });
        tokenRequest.send(data);
    } else {
        console.log(request.status);
        console.log(request.statusText);
    }
}




// do something with myJson

var isSigny = false;

function plusPointClick() {
    var checkHtml = document.getElementById('sonantWeb').innerHTML;
    if (checkHtml == "") {
        // var innerHtml = '<div id="remote-playerlist" class="player-dimension"></div><div><p>Please select text and play from here </p><button type="button" onclick="sendSentance();">Play</button></div>';
        var innerHtml = '<div id="remote-playerlist" class="player-dimension"></div>';
        document.getElementById('sonantWeb').innerHTML = innerHtml;
        document.getElementById('sonantWeb').style.display = "block";
        document.body.style.cursor = 'pointer';
        isSigny = true;
        join();
    } else {
        document.getElementById('sonantWeb').innerHTML = "";
        document.getElementById('sonantWeb').style.display = "none";
        document.body.style.cursor = 'default';
        isSigny = false;
        leave();
    }
}

async function join() {

    // create Agora client

    if (options.role === "audience") {
        client.setClientRole(options.role, { level: options.audienceLatency });
        // add event listener to play remote tracks when remote user publishs.
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
    } else {
        client.setClientRole(options.role);
    }

    // join the channel
    options.uid = await client.join(options.appid, options.channel, options.token || null, options.uid || null);

    if (options.role === "host") {
        // create local audio and video tracks
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        // play local video track
        localTracks.videoTrack.play("local-player");
        $("#local-player-name").text(`localTrack(${options.uid})`);
        // publish local tracks to channel
        await client.publish(Object.values(localTracks));
        console.log("publish success");
    }
}

async function leave() {
    for (trackName in localTracks) {
        var track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            localTracks[trackName] = undefined;
        }
    }

    // remove remote users and player views
    remoteUsers = {};
    $("#remote-playerlist").html("");

    // leave the channel
    await client.leave();

    $("#local-player-name").text("");
    $("#join").attr("disabled", false);
    $("#leave").attr("disabled", true);
    console.log("client leaves channel success");
}

async function subscribe(user, mediaType) {
    const uid = user.uid;
    // subscribe to a remote user
    await client.subscribe(user, mediaType);
    console.log("subscribe success");
    if (mediaType === 'video') {
        const player = $(`
      <div id="player-wrapper-${uid}">
        <div id="player-${uid}" class="player"></div>
      </div>
    `);
        $("#remote-playerlist").append(player);
        user.videoTrack.play(`player-${uid}`, { fit: "contain", mirror: 1 });
    }
    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}

function handleUserPublished(user, mediaType) {
    const id = user.uid;
    remoteUsers[id] = user;
    subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
    const id = user.uid;
    delete remoteUsers[id];
    $(`#player-wrapper-${id}`).remove();
}

function sendSentanceNew(framedata) {
    if (options.channel == null) {
        alert("sorry ! you are not connected !!!");
        return;
    }
    //let framedata = document.getSelection().toString();
    let showSign = framedata.toUpperCase();
    let channelName = options.channel;
    let request = new XMLHttpRequest();
    request.open("POST", "https://us-central1-dsiapp-103c4.cloudfunctions.net/sendStringToChannel", true);
    request.setRequestHeader("Content-Type", "application/json");
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {}
    };
    var data = JSON.stringify({ "framedata": framedata, "showSign": showSign, "channelName": channelName });
    request.send(data);
}
var doc = $(document);

doc.mouseover(function(e) {
    var elems = document.body.getElementsByTagName("*");
    for (var i = 0; i < elems.length; i++) {
        $(elems[i]).css("text-decoration", "none");
    }
    if (isSigny == true) {
        if ($(e.target)[0].childNodes[0] != undefined) {
            if ($(e.target)[0].childNodes[0].nodeName == "#text") {
                $(e.target).css("text-decoration", "underline");
                $(e.target).click(function(e) {
                    sendSentanceNew($(e.target).text());
                });
            }
        }
    }
})