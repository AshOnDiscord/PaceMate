console.log("Background script running");

const stateMap = ["productive", "neutral", "unproductive"];

// Example: listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender) => {
  // console.log("Received message in background:", message);
  // you can process messages or perform background tasks here
  if (message.type === "SEND_PRODUCTIVITY_DATA") {
    fetch("http://localhost:3000/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message.payload),
    })
      .then((res) => res.json())
      .then((json) => {
        console.log(
          "Model response:",
          stateMap[json.state],
          stateMap[Math.round(json.avg)],
          json.scores
        );
      })
      .catch((err) => console.error("Fetch error:", err));
  }
});
