import * as tf from "@tensorflow/tfjs-node";
import TrainingData from "./trainingData";
import {
  labelMapInverse,
  ProductivityState,
  type ProductivityData,
} from "../types";

export const createModel = (): tf.LayersModel => {
  const model = tf.sequential();
  model.add(
    tf.layers.conv1d({
      inputShape: [
        20,
        (
          [
            "applicationChangeCount",
            "idleSeconds",
            "keystrokesPerMinute",
            "mouseEventsPerMinute",
            "wpm",
          ] as (keyof ProductivityData)[]
        ).length,
      ],
      filters: 32,
      kernelSize: 3,
      activation: "relu",
    })
  );

  model.add(tf.layers.maxPooling1d({ poolSize: 2 }));
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(
    tf.layers.conv1d({
      filters: 64,
      kernelSize: 3,
      activation: "relu",
    })
  );

  model.add(tf.layers.flatten());
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 64, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 3, activation: "softmax" })); // 3 classes

  model.compile({
    loss: "categoricalCrossentropy",
    optimizer: "adam",
    metrics: ["accuracy"],
  });

  return model;
};

export const trainModel = async (model: tf.LayersModel) => {
  const trainingFeatures = TrainingData.map((chunk) =>
    chunk.map((s) => [
      s.features.wpm,
      s.features.keystrokesPerMinute,
      s.features.mouseEventsPerMinute,
      s.features.idleSeconds,
      s.features.applicationChangeCount,
    ])
  );
  const trainingLabels = TrainingData.map((chunk) => {
    const counts = [0, 0, 0]; // [prod, reg, distracted]
    for (const frame of chunk) counts[frame.label]!++;
    const majorityLabel = counts.indexOf(Math.max(...counts));
    return tf.oneHot(majorityLabel, 3);
  });

  const labelCounts = [0, 0, 0];
  TrainingData.forEach((chunk) => {
    chunk.forEach((frame) => {
      labelCounts[frame.label]!++;
    });
  });
  console.log("Label distribution:", labelCounts);

  const featureTensor = tf.tensor3d(trainingFeatures); // shape: [batch, 60, 5]
  const labelTensor = tf.stack(trainingLabels); // shape: [batch, 3]
  await model.fit(featureTensor, labelTensor, {
    epochs: 30,
    shuffle: true,
    batchSize: 16,
    verbose: 1,
  });

  return model;
};

export async function modelPredict(
  model: tf.LayersModel,
  input: ProductivityData[]
) {
  if (input.length !== 20) throw new Error("Window must be exactly 60 frames");
  const inputTensor = tf.tensor3d([
    input.map((frame) => [
      frame.wpm,
      frame.keystrokesPerMinute,
      frame.mouseEventsPerMinute,
      frame.idleSeconds,
      frame.applicationChangeCount,
    ]),
  ]); // shape: [1, 60, 5]

  const prediction = model.predict(inputTensor) as tf.Tensor;
  const scores = prediction.dataSync();
  const maxIndex = scores.indexOf(Math.max(...scores));
  console.log(
    `Prediction: ${labelMapInverse[maxIndex]} (scores: ${[...scores].map((v) =>
      v.toFixed(3)
    )})`
  );
  return {
    state: maxIndex,
    scores: [...scores],
  };
}
