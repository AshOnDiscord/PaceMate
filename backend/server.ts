import type { ServerWebSocket } from "bun";
import { type ExtraData, type ProductivityData } from "../types";
import { createModel, modelPredict, trainModel } from "./model/model";
import Timer from "./timer/pomodoro";

const model = createModel();
await trainModel(model);

const clients: Set<ServerWebSocket<unknown>> = new Set();
let activeWebsite = "unknown";

const server = Bun.serve({
  port: 3001,
  routes: {
    "/data": {
      POST: async (req) => {
        const json = (await req.json()) as ProductivityData & ExtraData;
        activeWebsite = json.activeWebsite;
        const result = await runModel(json as ProductivityData);
        predictionQueue.push(result.scores);
        while (predictionQueue.length > 20) {
          predictionQueue.shift(); // Keep the queue size manageable
        }
        const avg = predictionQueue
          .reduce(
            (acc, state) => {
              return [acc[0] + state[0], acc[1] + state[1], acc[2] + state[2]];
            },
            [0, 0, 0]
          )
          .map((v) => v / predictionQueue.length);

        const avgResult = avg.indexOf(Math.max(...avg));

        // console.log("Model result:", {
        //   ...result,
        //   avg,
        //   avgResult,
        // });
        return new Response(
          JSON.stringify({
            ...result,
            avg,
            avgResult,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      },
      OPTIONS: () => {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      },
    },

    "/ws": {
      GET: (req): Response | undefined => {
        const success = server.upgrade(req);
        return success
          ? undefined
          : new Response("WebSocket upgrade error", { status: 400 });
      },
    },
  },
  websocket: {
    open(ws) {
      console.log("WebSocket opened");
      clients.add(ws);
    },
    close(ws, code, reason) {
      console.log("WebSocket closed");
      clients.delete(ws);
    },
    message(ws, message) {
      console.log("WebSocket message received:", message);
      // Handle incoming messages if needed
      if (typeof message === "string") {
        if (message === "pause") {
          timer.pause();
        }
        if (message === "resume") {
          timer.resume();
        }
        if (message === "reset") {
          timer.reset();
        }
      }
    },
  },
});

const predictionQueue: [number, number, number][] = [];

async function runModel(data: ProductivityData): Promise<{
  state: number;
  scores: [number, number, number];
}> {
  return modelPredict(model, data);
}

const timer = new Timer();

setInterval(() => {
  const avg = predictionQueue
    .reduce(
      (acc, state) => {
        return [acc[0] + state[0], acc[1] + state[1], acc[2] + state[2]];
      },
      [0, 0, 0]
    )
    .map((v) => v / predictionQueue.length);
  const state = avg.indexOf(Math.max(...avg));
  timer.update(state);
  console.log("Broadcasting data");
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(
        JSON.stringify({
          workEnd: timer.workStart + timer.currentWorkLength,
          breakEnd: timer.breakStart + timer.breakLength,
          length: timer.currentWorkLength / 60_000,
          phase: timer.state,
          score: avg,
          paused: timer.isPaused,
          activeWebsite,
        })
      );
    }
  });
}, 1000); // Update every second
