fetch("/match", { method: "POST" })
    .then(res => res.text())
    .then(data => {
        document.getElementById("status").innerText =
            data === "NO_PEER_ONLINE"
                ? "No peer online. Please wait."
                : "Peer found. You can start practice.";
    });
