console.log("Content script loaded on page:", window.location.href);

const keyTimestamps = [];
const wordTimestamps = [];
const mouseEventScores = []; // { time, score }
let idleTimer = new Date().getTime();

// ⌨️ Key tracking
document.addEventListener("keydown", (e) => {
  const now = Date.now();

  if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
    keyTimestamps.push(now);
    idleTimer = new Date().getTime();
  }

  if (e.key === " " || e.key === "Enter") {
    wordTimestamps.push(now);
    idleTimer = new Date().getTime();
  }
});

// 🖱️ Mouse tracking
document.addEventListener("mousemove", (e) => {
  const dist = Math.sqrt(e.movementX ** 2 + e.movementY ** 2);
  if (dist < 1) return; // Ignore very small movements
  idleTimer = new Date().getTime(); // Reset idle timer
  const now = Date.now();
  mouseEventScores.push({ time: now, score: dist * 5e-3 });
});
["mousedown", "mouseup"].forEach((event) =>
  document.addEventListener(event, () => {
    idleTimer = new Date().getTime(); // Reset idle timer
    mouseEventScores.push({ time: Date.now(), score: 1 });
  })
);
document.addEventListener("wheel", (e) => {
  idleTimer = new Date().getTime(); // Reset idle timer
  const now = Date.now();
  const delta = Math.abs(e.deltaX) + Math.abs(e.deltaY);
  mouseEventScores.push({ time: now, score: delta * 1e-3 });
});

// 🧮 Periodic calculation (moving window of 60s)
setInterval(async () => {
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

  if (!document.hasFocus()) return; // Skip if the document is not focused

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
  };

  console.log(data);

  chrome.runtime.sendMessage({
    type: "SEND_PRODUCTIVITY_DATA",
    payload: data,
  });
}, 1000); // update every second
