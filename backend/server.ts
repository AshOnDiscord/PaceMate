import { type ProductivityData } from "../types";
import { createModel, modelPredict, trainModel } from "./model/model";
import { update } from "./timer/pomodoro";

const model = createModel();
await trainModel(model);

Bun.serve({
  port: 3000,
  routes: {
    "/data": {
      POST: async (req) => {
        const json = await req.json();
        console.log("Received data:", json);
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

        console.log("Model result:", {
          ...result,
          avg,
          avgResult,
        });
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
  },
});

const predictionQueue: [number, number, number][] = [];

async function runModel(data: ProductivityData): Promise<{
  state: number;
  scores: [number, number, number];
}> {
  return modelPredict(model, data);
}

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
  update(state);
}, 1000); // Update every second
