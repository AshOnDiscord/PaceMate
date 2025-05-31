console.log("Background script running");

const stateMap = ["productive", "neutral", "unproductive"];

const keyTimestamps = [];
const wordTimestamps = [];
const mouseEventScores = []; // { time, score }
let idleTimer = new Date().getTime();

// Example: listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender) => {
  // console.log("Received message in background:", message);
  // you can process messages or perform background tasks here
  if (message.type === "keyTimestamp") {
    keyTimestamps.push(message.payload);
  } else if (message.type === "wordTimestamp") {
    wordTimestamps.push(message.payload);
  } else if (message.type === "mouseEventScores") {
    mouseEventScores.push(message.payload);
  } else if (message.type === "idleTimer") {
    idleTimer = message.payload;
  }
});

// 🧮 Periodic calculation (moving window of 60s)
let currentHostname;
setInterval(async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.url) {
      const url = new URL(tab.url);
      const hostname = url.hostname;
      currentHostname = hostname;
    }
  });
  const now = Date.now();
  const windowSize = 5 * 1000; // 20 seconds
  const threshold = now - windowSize;

  // ⌨️ Clean old timestamps
  while (keyTimestamps.length && keyTimestamps[0] < threshold) {
    keyTimestamps.shift();
  }
  while (wordTimestamps.length && wordTimestamps[0] < threshold) {
    wordTimestamps.shift();
  }

  // 🖱️ Clean old mouse events
  while (mouseEventScores.length && mouseEventScores[0].time < threshold) {
    mouseEventScores.shift();
  }

  const wpm = (wordTimestamps.length * 60_000) / windowSize;
  const keystrokesPerMinute = (keyTimestamps.length * 60_000) / windowSize;
  const mouseEventsPerMinute =
    (mouseEventScores.reduce((sum, e) => sum + e.score, 0) * 60_000) /
    windowSize;

  idleSeconds = Math.floor((now - idleTimer) / 1000);
  const idleThreshold = 10 * 1000; // 10s
  wasIdle = now - idleTimer >= idleThreshold;

  const data = {
    wpm,
    keystrokesPerMinute,
    mouseEventsPerMinute,
    idleSeconds,
    applicationChangeCount: 0, // Placeholder for application change count
    activeWebsite: currentHostname,
  };

  // console.log(data);

  // chrome.runtime.sendMessage({
  //   type: "SEND_PRODUCTIVITY_DATA",
  //   payload: data,
  // });
  getStatus(data);
}, 1000); // update every second

const getStatus = async (data) => {
  fetch("http://localhost:3001/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((json) => {
      console.log(
        "Model response:",
        stateMap[json.state],
        stateMap[Math.round(json.avgResult)],
        json.scores,
        json.avg,
        json.avgResult,
        `current: ${data.activeWebsite}`
      );
    })
    .catch((err) => console.error("Fetch error:", err));
};
