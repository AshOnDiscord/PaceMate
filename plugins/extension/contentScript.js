console.log("Content script loaded on page:", window.location.href);

// ⌨️ Key tracking
document.addEventListener("keydown", (e) => {
  const now = Date.now();

  if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
    // keyTimestamps.push(now);
    // idleTimer = new Date().getTime();
    chrome.runtime.sendMessage({
      type: "keyTimestamp",
      payload: now,
    });
    chrome.runtime.sendMessage({
      type: "idleTimer",
      payload: now,
    });
  }

  if (e.key === " " || e.key === "Enter") {
    // wordTimestamps.push(now);
    // idleTimer = new Date().getTime();
    chrome.runtime.sendMessage({
      type: "wordTimestamp",
      payload: now,
    });
    chrome.runtime.sendMessage({
      type: "idleTimer",
      payload: now,
    });
  }
});

// 🖱️ Mouse tracking
document.addEventListener("mousemove", (e) => {
  const dist = Math.sqrt(e.movementX ** 2 + e.movementY ** 2);
  if (dist < 1) return; // Ignore very small movements
  // idleTimer = new Date().getTime(); // Reset idle timer
  const now = Date.now();
  // mouseEventScores.push({ time: now, score: dist * 5e-3 });
  chrome.runtime.sendMessage({
    type: "mouseEventScores",
    payload: { time: now, score: dist * 5e-3 },
  });
  chrome.runtime.sendMessage({
    type: "idleTimer",
    payload: now,
  });
});
["mousedown", "mouseup"].forEach((event) =>
  document.addEventListener(event, () => {
    // idleTimer = new Date().getTime(); // Reset idle timer
    // mouseEventScores.push({ time: Date.now(), score: 1 });
    chrome.runtime.sendMessage({
      type: "mouseEventScores",
      payload: { time: Date.now(), score: 1 },
    });
    chrome.runtime.sendMessage({
      type: "idleTimer",
      payload: Date.now(),
    });
  })
);
document.addEventListener("wheel", (e) => {
  // idleTimer = new Date().getTime(); // Reset idle timer
  const now = Date.now();
  const delta = Math.abs(e.deltaX) + Math.abs(e.deltaY);
  // mouseEventScores.push({ time: now, score: delta * 1e-3 });
  chrome.runtime.sendMessage({
    type: "mouseEventScores",
    payload: { time: now, score: delta * 1e-3 },
  });
  chrome.runtime.sendMessage({
    type: "idleTimer",
    payload: now,
  });
});
