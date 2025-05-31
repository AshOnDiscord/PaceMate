import { ProductivityState, type ProductivityData } from "../types";

export const getData = async (
  file: string,
  chunkSize: number = 20
): Promise<
  {
    features: ProductivityData;
    label: ProductivityState;
  }[][]
> => {
  const response = await Bun.file(file).text();
  const lines = response.split("\n").filter(Boolean);
  const unchunked: {
    features: ProductivityData;
    label: ProductivityState;
  }[] = lines.map((line) => {
    const data = JSON.parse(line);
    return data;
  });
  // split into chunks of chunkSize
  const chunks: {
    features: ProductivityData;
    label: ProductivityState;
  }[][] = [];
  for (let i = 0; i < unchunked.length; i += chunkSize) {
    const chunk = unchunked.slice(i, i + chunkSize);
    if (chunk.length === chunkSize) {
      chunks.push(chunk);
    }
  }
  return chunks;
};

export const getTrainingData = async () => {
  const distractedData = await getData("distracted.json");
  const regularData = await getData("regular.json");
  const productiveData = await getData("productive.json");

  return [...distractedData, ...regularData, ...productiveData];
};

export default await getTrainingData();
