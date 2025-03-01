import { useEffect, useState } from "react";

type Feature = {
  title: string;
  content: string;
  id: string;
};

export const useFeaturesList = (mdContentList: string[]) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const parsedFeatures = mdContentList
      .map((content) => {
        const data = content.split("|");
        if (data?.length) {
          return {
            id: data[0].trim(),
            title: data[1],
            content: data[2],
          };
        }
        return null;
      })
      .filter((result): result is Feature => result !== null);

    setFeatures(parsedFeatures);
  }, []);
  return features;
};
