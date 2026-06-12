import { useCallback, useEffect, useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import Loading from "../../../components/Loading";
import StateMessage from "../../../components/StateMessage";
import { useGetData } from "../../../hooks/useGetData";
import { useGetDate } from "../../../hooks/useGetDateTime";

const PAGE_SIZE = 10;
const fields = [
  ["Purwodadi LSTM", "prediksi_level_muka_air_purwodadi_lstm"],
  ["Purwodadi GRU", "prediksi_level_muka_air_purwodadi_gru"],
  ["Purwodadi TCN", "prediksi_level_muka_air_purwodadi_tcn"],
  ["Dhompo LSTM", "prediksi_level_muka_air_dhompo_lstm"],
  ["Dhompo GRU", "prediksi_level_muka_air_dhompo_gru"],
  ["Dhompo TCN", "prediksi_level_muka_air_dhompo_tcn"],
];

const PrediksiTable = ({ user }) => {
  const [rows, setRows] = useState(null);
  const [totalLength, setTotalLength] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const { getDate, getTime } = useGetDate();
  const { getPredictionHistory, isLoading, error } = useGetData();

  const load = useCallback(async () => {
    const token = user ? user.authorization.token : "def";
    const response = await getPredictionHistory(
      token,
      pageIndex * PAGE_SIZE,
      PAGE_SIZE,
    );
    if (response?.data) {
      setRows(
        Array.isArray(response.data.history) ? response.data.history : [],
      );
      setTotalLength(Number(response.data.total_count) || 0);
    } else setRows(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, user]);

  useEffect(() => {
    load();
  }, [load]);
  if (isLoading && rows === null)
    return (
      <div className="py-12">
        <Loading size="30px" color="#18181b" />
      </div>
    );
  if (error)
    return (
      <div className="mt-6">
        <StateMessage
          tone="error"
          title="Data prediksi tidak dapat dimuat"
          message={error.response?.data?.message || error.message}
          onAction={load}
        />
      </div>
    );
  if (rows?.length === 0)
    return (
      <div className="mt-6">
        <StateMessage
          title="Belum ada data prediksi"
          message="Hasil prediksi belum tersedia pada halaman ini."
        />
      </div>
    );
  if (!rows) return null;
  const lastPage = Math.max(0, Math.ceil(totalLength / PAGE_SIZE) - 1);
  const start = pageIndex * PAGE_SIZE + 1;
  const end = Math.min(start + rows.length - 1, totalLength);

  return (
    <div className="mt-6">
      <div className="grid gap-3 lg:hidden">
        {rows.map((item) => (
          <article key={item.id} className="rounded-xl border p-4">
            <div className="flex justify-between">
              <p className="font-semibold">Prediksi #{item.id}</p>
              <p className="text-xs text-zinc-500">
                {getDate(item.predicted_for_time)} ·{" "}
                {getTime(item.predicted_for_time)}
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {fields.map(([label, key]) => (
                <div key={key}>
                  <dt className="text-xs text-zinc-500">{label}</dt>
                  <dd className="font-medium">{item[key] ?? "-"} m</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border lg:block">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-3 py-3 text-left">ID</th>
              <th className="px-3 py-3 text-left">Tanggal</th>
              <th className="px-3 py-3 text-left">Jam</th>
              {fields.map(([label]) => (
                <th key={label} className="px-3 py-3 text-left">
                  {label} (m)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-3">{item.id}</td>
                <td className="px-3 py-3">
                  {getDate(item.predicted_for_time)}
                </td>
                <td className="px-3 py-3">
                  {getTime(item.predicted_for_time)}
                </td>
                {fields.map(([, key]) => (
                  <td key={key} className="px-3 py-3">
                    {item[key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
        <p>
          Menampilkan {start}-{end} dari {totalLength}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((value) => value - 1)}
            className="rounded-lg border p-2 disabled:opacity-40"
          >
            <BsChevronLeft />
          </button>
          <button
            type="button"
            aria-label="Halaman berikutnya"
            disabled={pageIndex >= lastPage}
            onClick={() => setPageIndex((value) => value + 1)}
            className="rounded-lg border p-2 disabled:opacity-40"
          >
            <BsChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrediksiTable;
