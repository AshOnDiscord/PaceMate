import { labelMapInverse, ProductivityState } from "../../types";
import { createModel, modelPredict, trainModel } from "./model";

const model = createModel();
await trainModel(model);

const labeledPredictions: {
  features: Parameters<typeof modelPredict>[1];
  expected: ProductivityState;
}[] = [
  {
    features: {
      wpm: 42,
      keystrokesPerMinute: 55,
      mouseEventsPerMinute: 38,
      idleSeconds: 2,
      applicationChangeCount: 1,
    },
    expected: ProductivityState.Productive,
  },
  {
    features: {
      wpm: 20,
      keystrokesPerMinute: 30,
      mouseEventsPerMinute: 20,
      idleSeconds: 8,
      applicationChangeCount: 2,
    },
    expected: ProductivityState.Regular,
  },
  {
    features: {
      wpm: 4,
      keystrokesPerMinute: 9,
      mouseEventsPerMinute: 4,
      idleSeconds: 45,
      applicationChangeCount: 5,
    },
    expected: ProductivityState.Distracted,
  },
];

let totalError = 0;
for (const p of labeledPredictions) {
  console.log(
    `Expected: ${labelMapInverse[p.expected]}: ${Object.entries(p.features)
      .map(([k, v]) => `${k}: ${v}`)
      .filter(Boolean)
      .join(", ")}`
  );
  const results = await modelPredict(model, p.features);
  const error = Math.abs(results.state - p.expected);
  totalError += error;
}
console.log(
  `Average error: ${
    totalError / [labeledPredictions].length
  } (total: ${totalError})`
);
