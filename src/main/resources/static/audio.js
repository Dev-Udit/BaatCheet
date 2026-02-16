console.log("audio.js loaded");

const socket = new WebSocket(
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host + "/signal"
);

const remoteAudio = document.getElementById("remoteAudio");
const myName = document.getElementById("myName").value;
const myNameTag = document.getElementById("myNameTag");
const statusText = document.getElementById("status");

if (myNameTag) myNameTag.innerText = myName;

let localStream;
let role;
let micOn = true;
let iceQueue = [];

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// FIX: Initialize PeerConnection IMMEDIATELY to prevent null errors when SDP arrives early.
let pc = new RTCPeerConnection(config);

pc.onicecandidate = e => {
    if (e.candidate) {
        socket.send(JSON.stringify({ ice: e.candidate }));
    }
};

pc.ontrack = e => {
    console.log("Remote audio track received");
    if (remoteAudio.srcObject !== e.streams[0]) {
        remoteAudio.srcObject = e.streams[0];
    }
    remoteAudio.play().catch(err => console.error("Audio playback failed:", err));
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
        statusText.innerText = "🎧 Connected. Speak now!";

        const partnerLabel = document.getElementById("partnerName");
        if (partnerLabel && data.partnerName) {
            partnerLabel.textContent = data.partnerName;
        }

        await startAudio();

        if (role === "caller") {
            await createOffer();
        }
        return;
    }

    /* SDP */
    if (data.sdp) {
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            while (iceQueue.length > 0) {
                await pc.addIceCandidate(new RTCIceCandidate(iceQueue.shift()));
            }

            if (data.sdp.type === "offer") {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({ sdp: answer }));
            }
        } catch (err) {
            console.error("Error setting remote description:", err);
        }
    }

    /* ICE */
    if (data.ice) {
        try {
            if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(data.ice));
            } else {
                iceQueue.push(data.ice);
            }
        } catch (err) {
            console.error("Error adding ICE candidate:", err);
        }
    }
};

async function startAudio() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });

        // Add tracks to the already-initialized connection
        localStream.getTracks().forEach(track =>
            pc.addTrack(track, localStream)
        );
    } catch (err) {
        console.error("Microphone access error:", err);
        statusText.innerText = "⚠️ Microphone access denied";
    }
}

async function createOffer() {
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.send(JSON.stringify({ sdp: offer }));
    } catch (err) {
        console.error("Offer creation error:", err);
    }
}

/* CONTROLS */
function toggleMute() {
    if (localStream) {
        micOn = !micOn;
        localStream.getAudioTracks().forEach(t => t.enabled = micOn);

        const muteBtn = document.getElementById("muteBtn");
        if (muteBtn) {
            muteBtn.innerText = micOn ? "🎤" : "🔇";
            // Updated to match the new dark mode CSS variables
            muteBtn.style.background = micOn ? "rgba(255, 255, 255, 0.1)" : "var(--danger)";
        }
    }
}

function endCall() {
    if (pc) pc.close();
    if (socket) socket.close();
    window.location.href = "/";
}