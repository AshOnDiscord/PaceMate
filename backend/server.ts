import { ProductivityState, type ProductivityData } from "../types";
import { appendFile } from "node:fs/promises";
import { createModel, modelPredict, trainModel } from "./model";

let queue: ProductivityData[] = [];

Bun.serve({
  port: 3000,
  routes: {
    "/data": {
      POST: async (req) => {
        const json = await req.json();
        console.log("Received data:", json);
        const result = await runModel(json as ProductivityData);
        if (result.state === -1) {
          console.log(
            "Not enough data to make a prediction yet.",
            queue.length
          );
        } else {
          console.log("Model result:", result);
        }
        return new Response(JSON.stringify(result), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
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

async function runModel(data: ProductivityData) {
  // Implement your ML model logic here (e.g., simple thresholding, or load trained weights)
  // Example dummy prediction:
  // if (data.wpm > 40) return { state: "Productive" };
  // if (data.wpm > 10) return { state: "Regular" };
  // return { state: -1 };
  // return { state: "Distracted" };
  // return modelPredict(model, data);
  // const currentState = ProductivityState.Distracted;
  // // add data to training set
  // await appendFile(
  //   "distracted.json",
  //   JSON.stringify({ features: data, label: currentState }) + "\n"
  // );
  queue.push(data);
  if (queue.length >= 20) {
    while (queue.length > 20) queue.shift(); // keep only the last 60 frames to reduce memory usage
    const prediction = await modelPredict(model, queue);
    return {
      state: prediction.state,
      scores: prediction.scores, // assuming modelPredict returns scores
    };
  }

  return {
    state: -1,
  };
}
