import api from "../api";
import { useState } from "react";
export const useStatistic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getChartData = async (token = "def", daerah, periode) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get(`/getChartData`, {
        params: {
          daerah: daerah.toLowerCase(),
          periode: Math.min(5, Math.max(1, Number(periode) || 1)),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsLoading(false);
      return res.data;
    } catch (error) {
      console.log(error);
      setError(error);
      setIsLoading(false);
      return;
    }
  };

  return { getChartData, isLoading, error };
};
