let isProcessing = false;
let recognition = null;

function startTalk() {
    if (isProcessing) {
        console.log("Blocked: already processing");
        return;
    }

    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported");
        return;
    }

    isProcessing = true;

    const resultDiv = document.getElementById("result");

    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    resultDiv.innerHTML = "🎧 Listening...";

   recognition.onresult = (event) => {

       // 🔥 ACCEPT ONLY FINAL RESULT
       if (!event.results[event.resultIndex].isFinal) {
           return;
       }

       recognition.stop();

       const text = event.results[event.resultIndex][0].transcript;

       document.getElementById("result").innerHTML = "🧑 You: " + text;

       callAI(text);
   };


    recognition.onerror = () => {
        cleanup();
    };

    recognition.onend = () => {
        // DO NOTHING — important
    };

    recognition.start();
}

async function callAI(text) {
    try {
        const res = await fetch("/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "text/plain" }, // Changed from application/json
            body: text // Send raw text instead of JSON.stringify(text)
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const aiReply = await res.text();

        document.getElementById("result").innerHTML =
            "🧑 You: " + text +
            "<br><br>🤖 AI: " + aiReply;

        speak(aiReply);

    } catch (e) {
        console.error("Error communicating with AI:", e);
        document.getElementById("result").innerHTML += "<br><br>⚠️ <i>Error connecting to the AI. Ensure Ollama is running.</i>";
        cleanup();
    }
}

function speak(text) {
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    utterance.onend = () => {
        cleanup(); // 🔓 ALWAYS unlock here
    };

    speechSynthesis.speak(utterance);
}

function cleanup() {
    if (recognition) {
        try { recognition.stop(); } catch {}
        recognition = null;
    }
    speechSynthesis.cancel();
    isProcessing = false; // 🔓 GUARANTEED UNLOCK
}
