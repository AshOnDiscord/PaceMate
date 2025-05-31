import { ProductivityState, type ProductivityData } from "../types";
import { appendFile } from "node:fs/promises";
import { createModel, modelPredict, trainModel } from "./model";

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

const model = createModel();
trainModel(model);

const predictionQueue: [number, number, number][] = [];

async function runModel(data: ProductivityData): Promise<{
  state: number;
  scores: [number, number, number];
}> {
  // Implement your ML model logic here (e.g., simple thresholding, or load trained weights)
  // Example dummy prediction:
  // if (data.wpm > 40) return { state: "Productive" };
  // if (data.wpm > 10) return { state: "Regular" };
  // return { state: "Distracted" };
  return modelPredict(model, data);
  // const currentState = ProductivityState.Distracted;
  // // add data to training set
  // await appendFile(
  //   "distracted.json",
  //   JSON.stringify({ features: data, label: currentState }) + "\n"
  // );
  return {
    state: 2,
    scores: [0, 0, 1],
  };
}
