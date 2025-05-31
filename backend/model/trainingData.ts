import { ProductivityState, type ProductivityData } from "../../types";

export const getData = async (
  file: string
): Promise<
  {
    features: ProductivityData;
    label: ProductivityState;
  }[]
> => {
  const response = await Bun.file(file).text();
  const lines = response.split("\n").filter(Boolean);
  return lines.map((line) => {
    const data = JSON.parse(line);
    return data;
  });
};

export const getTrainingData = async () => {
  const distractedData = await getData("distracted.json");
  const regularData = await getData("regular.json");
  const productiveData = await getData("productive.json");

  return [...distractedData, ...regularData, ...productiveData];
};

export default await getTrainingData();
