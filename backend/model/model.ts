import * as tf from "@tensorflow/tfjs-node";
import TrainingData from "./trainingData.ts";
import { type ProductivityData } from "../../types";

export const createModel = (): tf.LayersModel => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [5], units: 16, activation: "relu" })
  );
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 12, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "sparseCategoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
};

export const trainModel = async (model: tf.LayersModel) => {
  const trainingFeatures = TrainingData.map((s) => [
    s.features.wpm,
    s.features.keystrokesPerMinute,
    s.features.mouseEventsPerMinute,
    s.features.idleSeconds,
    s.features.applicationChangeCount,
  ]);
  const trainingLabels = TrainingData.map((s) => s.label);

  const trainingData = tf.tensor2d(trainingFeatures);
  const labels = tf.tensor1d(trainingLabels, "float32");

  await model.fit(trainingData, labels, {
    epochs: 100,
    shuffle: true,
    verbose: 0,
  });

  return model;
};

export async function modelPredict(
  model: tf.LayersModel,
  input: ProductivityData
) {
  const inputTensor = tf.tensor2d([
    [
      input.wpm,
      input.keystrokesPerMinute,
      input.mouseEventsPerMinute,
      input.idleSeconds,
      input.applicationChangeCount,
    ],
  ]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const scores = prediction.dataSync();
  const maxIndex = scores.indexOf(Math.max(...scores));
  // console.log(
  //   `Prediction: ${labelMapInverse[maxIndex]} (scores: ${[...scores].map((v) =>
  //     v.toFixed(3)
  //   )})`
  // );
  return {
    state: maxIndex,
    scores: [...scores] as [number, number, number],
  };
}
