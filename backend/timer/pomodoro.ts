import { max } from "@tensorflow/tfjs-node";
import { ProductivityState } from "../../types";

let workStart = new Date().getTime();
let minWorkLength = 10 * 60 * 1000; // 10 minutes
let maxWorkLength = 60 * 60 * 1000; // 60 minutes
let defaultWorkLength = 25 * 60 * 1000; // 25 minutes

let currentWorkLength = defaultWorkLength;

let state: "work" | "break" = "work";

let breakStart = new Date().getTime();
let breakLength = 5 * 60 * 1000; // 5 minutes

export function startWork() {
  workStart = new Date().getTime();
  state = "work";
  currentWorkLength = defaultWorkLength;
  console.log(`Work started at ${new Date(workStart).toLocaleTimeString()}`);
}

export function endWork() {
  const workEnd = new Date().getTime();
  const workDuration = workEnd - workStart;
  console.log(`Work ended at ${new Date(workEnd).toLocaleTimeString()}`);
  console.log(`Worked for ${Math.round(workDuration / 1000)} seconds`);
  state = "break";
}

export function autoEndWork() {
  const now = new Date().getTime();
  if (state === "work" && now >= workStart + currentWorkLength) {
    console.log(
      `Auto ending work at ${new Date(now).toLocaleTimeString()} after ${
        (now - workStart) / 1000
      } seconds`,
      currentWorkLength / 1000
    );
    endWork();
  }
}

export function autoEndBreak() {
  const now = new Date().getTime();
  if (state === "break" && now >= breakStart + breakLength) {
    console.log(
      `Auto ending break at ${new Date(now).toLocaleTimeString()} after ${
        (now - breakStart) / 1000
      } seconds`,
      breakLength / 1000
    );
    startWork();
  }
}

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

export function updateTimer(productivity: ProductivityState) {
  switch (productivity) {
    case ProductivityState.Productive:
      currentWorkLength = clamp(
        currentWorkLength + (2 * 60 * 1000) / (60_000 / 1000),
        minWorkLength,
        maxWorkLength
      ); // Increase work length by 2 minutes per minute of productivity, up to max
      break;
    case ProductivityState.Regular:
      const diff = currentWorkLength - defaultWorkLength;
      currentWorkLength = clamp(
        currentWorkLength - (diff * 0.1) / (60_000 / 1000),
        minWorkLength,
        maxWorkLength
      ); // Slowly head towards default work length by 10% per minte
      break;
    case ProductivityState.Distracted:
      currentWorkLength = clamp(
        currentWorkLength - (2 * 60 * 1000) / (60_000 / 1000),
        minWorkLength,
        maxWorkLength
      ); // Decrease work length by 2 minutes per minute of distraction, down to min
      break;
  }
}

export function update(state: ProductivityState) {
  autoEndWork();
  autoEndBreak();
  updateTimer(state);
  console.log(
    `Current state: ${state}, current work length: ${(
      currentWorkLength /
      1000 /
      60
    ).toFixed(2)} minutes, time left: ${(
      (workStart + currentWorkLength - new Date().getTime()) /
      1000 /
      60
    ).toFixed(2)} minutes`
  );
}
