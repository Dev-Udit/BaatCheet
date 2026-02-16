console.log("video.js loaded");

const socket = new WebSocket(
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host + "/signal"
);

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const myName = document.getElementById("myName").value;

// UI tags
const myNameTag = document.getElementById("myNameTag");
const statusText = document.getElementById("status");

myNameTag.innerText = myName;

let pc;
let localStream;
let role;
let micOn = true;
let camOn = true;

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

/* JOIN SOCKET */
socket.onopen = () => {
    socket.send(JSON.stringify({ type: "join" }));
};

socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);

    /* START CALL */
    if (data.start) {
        role = data.role;
        statusText.innerText = "Connected. Speak now 🎧";

        // ✅ SHOW PARTNER NAME (NOT ID)
        const partnerLabel = document.getElementById("partnerName");
        if (partnerLabel && data.partnerName) {
            partnerLabel.textContent = data.partnerName;
        }

        await startVideo();

        if (role === "caller") {
            await createOffer();
        }
        return;
    }

    /* SDP */
    if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.send(JSON.stringify({ sdp: answer }));
        }
    }

    /* ICE */
    if (data.ice) {
        await pc.addIceCandidate(new RTCIceCandidate(data.ice));
    }
};

async function startVideo() {
    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    localVideo.srcObject = localStream;

    pc = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track =>
        pc.addTrack(track, localStream)
    );

    pc.onicecandidate = e => {
        if (e.candidate) {
            socket.send(JSON.stringify({ ice: e.candidate }));
        }
    };

    pc.ontrack = e => {
        remoteVideo.srcObject = e.streams[0];
        // ❌ DO NOT HIDE NAME HERE
    };
}

async function createOffer() {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.send(JSON.stringify({ sdp: offer }));
}

/* CONTROLS */
function toggleMute() {
    if (localStream) {
        micOn = !micOn;
        localStream.getAudioTracks().forEach(t => t.enabled = micOn);

        // Visual UI feedback
        const muteBtn = document.getElementById("muteBtn");
        if (muteBtn) {
            muteBtn.innerText = micOn ? "🎤" : "🔇";
            muteBtn.style.background = micOn ? "var(--card)" : "var(--danger)";
        }
    }
}

function toggleCamera() {
    if (localStream) {
        camOn = !camOn;
        localStream.getVideoTracks().forEach(t => t.enabled = camOn);

        // Visual UI feedback
        const camBtn = document.getElementById("camBtn");
        if (camBtn) {
            camBtn.innerText = camOn ? "📷" : "🚫";
            camBtn.style.background = camOn ? "var(--card)" : "var(--danger)";
        }
    }
}


function endCall() {
    if (pc) pc.close();
    socket.close();
    window.location.href = "/";
}
