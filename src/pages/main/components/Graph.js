import {
  Chart as ChartJs,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useStatistic } from "../../../hooks/useStatistic";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useEffect, useState } from "react";
import { useGetDate } from "../../../hooks/useGetDateTime";
import {
  centimetersToMeters,
  getWaterLevelScaleMax,
} from "../../../utils/waterLevel";
import Loading from "../../../components/Loading";
import StateMessage from "../../../components/StateMessage";
ChartJs.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);
const Graph = ({ params, setters }) => {
  const [aktualData, setAktualData] = useState([]);
  const [prediksiData, setPrediksiData] = useState([]);
  const [dates, setDates] = useState([]);

  const { getChartData, isLoading, error } = useStatistic();
  const { getTime } = useGetDate();
  const { daerah } = params;
  const { user } = useAuthContext();

  const transitionData = dates.map(() => null);
  let lastActualIndex = -1;
  aktualData.forEach((value, index) => {
    if (value != null) lastActualIndex = index;
  });
  const firstFutureIndex = prediksiData.findIndex(
    (value, index) =>
      index > lastActualIndex && value != null && aktualData[index] == null,
  );

  if (lastActualIndex >= 0 && firstFutureIndex >= 0) {
    transitionData[lastActualIndex] = aktualData[lastActualIndex];
    transitionData[firstFutureIndex] = prediksiData[firstFutureIndex];
  }

  const scaleMax = getWaterLevelScaleMax([...aktualData, ...prediksiData]);

  const data = {
    labels: dates.map((date) => {
      return getTime(date);
    }),
    datasets: [
      {
        label: "Aktual",
        data: aktualData,
        borderColor: "rgb(35,211,237)",
        pointRadius: 3,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "black",
        pointHoverBorderColor: "rgba(0,0,0,0.3)",
        pointHoverBorderWidth: 10,
        backgroundColor: (context) => {
          if (!context.chart.chartArea) {
            return;
          }
          const {
            ctx,
            chartArea: { top, bottom },
          } = context.chart;
          const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
          gradientBg.addColorStop(0, "rgba(35,211,237,1)");
          gradientBg.addColorStop(0.3, "rgba(35,211,237,.5)");
          gradientBg.addColorStop(1, "rgba(35,211,237,0)");
          return gradientBg;
        },
        tension: 0.1,
        fill: true,
      },
      {
        label: "Transisi",
        data: transitionData,
        borderColor: "rgb(247,91,2)",
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.1,
        spanGaps: true,
        backgroundColor: (context) => {
          if (!context.chart.chartArea) return;
          const {
            ctx,
            chartArea: { top, bottom },
          } = context.chart;
          const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
          gradientBg.addColorStop(0, "rgba(247,91,2,1)");
          gradientBg.addColorStop(0.3, "rgba(247,91,2,.5)");
          gradientBg.addColorStop(1, "rgba(247,91,2,0)");
          return gradientBg;
        },
        order: 2,
        fill: true,
      },
      {
        label: "Prediksi",
        data: prediksiData,
        borderColor: "rgb(247,91,2)",
        pointRadius: 3,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: "black",
        pointHoverBorderColor: "rgba(0,0,0,0.3)",
        pointHoverBorderWidth: 10,
        backgroundColor: (context) => {
          if (!context.chart.chartArea) {
            return;
          }
          const {
            ctx,
            chartArea: { top, bottom },
          } = context.chart;
          const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
          gradientBg.addColorStop(0, "rgba(247,91,2,1)");
          gradientBg.addColorStop(0.3, "rgba(247,91,2,.5)");
          gradientBg.addColorStop(1, "rgba(247,91,2,0)");
          return gradientBg;
        },
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    mouseLine: {
      color: "black",
    },
    plugins: {
      legend: {
        labels: {
          boxHeight: 1,
          font: { family: "'Poppins', 'sans-serif'" },
          filter: (item) => item.text !== "Transisi",
        },
        align: "end",
      },
      tooltip: {
        enabled: true,
        filter: (context) => context.dataset.label !== "Transisi",
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.formattedValue} m`;
          },
        },
        mode: "index",
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Tinggi Air (m)",
          color: "black",
        },
        suggestedMax: scaleMax,
        suggestedMin: 0,
        grid: {
          color: "rgba(0,0,0,.05)",
        },
        border: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          tickBorderDash: [8, 4],
        },
      },
      x: {
        title: {
          display: true,
          text: "Periode Waktu",
          color: "black",
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  useEffect(() => {
    const handleLoadChartData = async () => {
      setDates([]);
      setAktualData([]);
      setPrediksiData([]);
      setters.setAktualAir(null);
      setters.setChartData([]);

      const token = user ? user.authorization.token : "def";
      const res = await getChartData(token, daerah, 5);
      let tempPred = [];
      let tempAct = [];
      let tempDate = [];
      let aktual = null;
      if (Array.isArray(res?.data)) {
        const normalizedData = res.data.map((item) => ({
          ...item,
          aktual: centimetersToMeters(item.aktual),
          prediksi: centimetersToMeters(item.prediksi),
        }));

        normalizedData.forEach((item) => {
          if (item.aktual != null) aktual = item.aktual;
          tempAct.push(item.aktual);
          tempPred.push(item.prediksi);
          tempDate.push(item.tanggal);
        });

        setDates(tempDate);
        setAktualData(tempAct);
        setPrediksiData(tempPred);
        setters.setAktualAir(aktual);
        setters.setChartData(normalizedData);
      }
    };
    handleLoadChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daerah]);

  return (
    <div className="h-full">
      <div className="h-[280px] sm:h-[320px]">
        {isLoading ? (
          <Loading size={"30px"} color="#000000" />
        ) : error ? (
          <StateMessage
            tone="error"
            title="Grafik tidak dapat dimuat"
            message={
              error.response?.status === 404
                ? "Prediksi belum tersedia untuk stasiun ini."
                : error.response?.data?.message || error.message
            }
          />
        ) : dates.length === 0 ? (
          <StateMessage
            title="Belum ada data grafik"
            message="Data aktual dan prediksi belum tersedia untuk periode ini."
          />
        ) : (
          <Line data={data} options={options}></Line>
        )}
      </div>
    </div>
  );
};

export default Graph;
