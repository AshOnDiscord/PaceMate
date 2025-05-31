import { max } from "@tensorflow/tfjs-node";
import { ProductivityState } from "../../types";

export default class Timer {
  public workStart = new Date().getTime();
  public minWorkLength = 10 * 60 * 1000; // 10 minutes
  public maxWorkLength = 60 * 60 * 1000; // 60 minutes
  public defaultWorkLength = 25 * 60 * 1000; // 25 minutes
  public isPaused = false;
  public pauseWorkRemaining = 0;
  public pauseBreakRemaining = 0;

  public currentWorkLength = this.defaultWorkLength;

  public state: "Work" | "Break" = "Break";

  public breakStart = new Date().getTime();
  public defaultBreakLength = 0.5 * 60 * 1000; // 5 minutes
  public breakLength = this.defaultBreakLength; // 5 minutes

  public startWork() {
    this.workStart = new Date().getTime();
    this.state = "Work";
    this.currentWorkLength = this.defaultWorkLength;
    console.log(
      `Work started at ${new Date(this.workStart).toLocaleTimeString()}`
    );
  }

  public endWork() {
    const workEnd = new Date().getTime();
    const workDuration = workEnd - this.workStart;
    console.log(`Work ended at ${new Date(workEnd).toLocaleTimeString()}`);
    console.log(`Worked for ${Math.round(workDuration / 1000)} seconds`);
    this.state = "Break";
    this.breakStart = new Date().getTime();
    this.breakLength = this.defaultBreakLength;
  }

  public autoEndWork() {
    const now = new Date().getTime();
    if (
      this.state === "Work" &&
      now >= this.workStart + this.currentWorkLength
    ) {
      console.log(
        `Auto ending work at ${new Date(now).toLocaleTimeString()} after ${
          (now - this.workStart) / 1000
        } seconds`,
        this.currentWorkLength / 1000
      );
      this.endWork();
    }
  }

  public autoEndBreak() {
    const now = new Date().getTime();
    if (this.state === "Break" && now >= this.breakStart + this.breakLength) {
      console.log(
        `Auto ending break at ${new Date(now).toLocaleTimeString()} after ${
          (now - this.breakStart) / 1000
        } seconds`,
        this.breakLength / 1000
      );
      this.startWork();
    }
  }

  public clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  public updateTimer(productivity: ProductivityState) {
    if (this.isPaused) {
      this.workStart = new Date().getTime();
      this.breakStart = new Date().getTime();
      this.currentWorkLength = this.pauseWorkRemaining;
      this.breakLength = this.pauseBreakRemaining;
      return;
    }

    switch (productivity) {
      case ProductivityState.Productive:
        this.currentWorkLength = this.clamp(
          this.currentWorkLength + (2 * 60 * 1000) / (60_000 / 1000),
          this.minWorkLength,
          this.maxWorkLength
        ); // Increase work length by 2 minutes per minute of productivity, up to max
        break;
      case ProductivityState.Regular:
        const diff = this.currentWorkLength - this.defaultWorkLength;
        this.currentWorkLength = this.clamp(
          this.currentWorkLength - (diff * 0.1) / (60_000 / 1000),
          this.minWorkLength,
          this.maxWorkLength
        ); // Slowly head towards default work length by 10% per minte
        break;
      case ProductivityState.Distracted:
        this.currentWorkLength = this.clamp(
          this.currentWorkLength - (2 * 60 * 1000) / (60_000 / 1000),
          this.minWorkLength,
          this.maxWorkLength
        ); // Decrease work length by 2 minutes per minute of distraction, down to min
        break;
    }
  }

  public update(state: ProductivityState) {
    this.autoEndWork();
    this.autoEndBreak();
    this.updateTimer(state);
    console.log(
      `Current state: ${state}, current work length: ${(
        this.currentWorkLength /
        1000 /
        60
      ).toFixed(2)} minutes, work time left: ${(
        (this.workStart + this.currentWorkLength - new Date().getTime()) /
        1000 /
        60
      ).toFixed(2)} minutes, break time left: ${(
        (this.breakStart + this.breakLength - new Date().getTime()) /
        1000 /
        60
      ).toFixed(2)} minutes, paused: ${this.isPaused}, pauseWorkRemaining: ${
        this.pauseWorkRemaining / 1000 / 60
      }, pauseBreakRemaining: ${this.pauseBreakRemaining / 1000 / 60}`
    );
  }

  public reset() {
    this.workStart = new Date().getTime();
    this.breakStart = new Date().getTime();
    this.currentWorkLength = this.defaultWorkLength;
    this.pauseWorkRemaining = this.defaultWorkLength;
    this.pauseBreakRemaining = this.defaultBreakLength;
    console.log("Timer reset");
  }

  public pause() {
    this.isPaused = true;
    this.pauseWorkRemaining =
      this.workStart + this.currentWorkLength - new Date().getTime();
    this.pauseBreakRemaining =
      this.breakStart + this.breakLength - new Date().getTime();
    console.log("Timer paused");
  }

  public resume() {
    this.isPaused = false;
    this.workStart = new Date().getTime();
    this.breakStart = new Date().getTime();
    this.pauseWorkRemaining = 0;
    this.pauseBreakRemaining = 0;
    console.log("Timer resumed");
  }
}
