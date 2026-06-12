import { useCallback, useEffect, useState } from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import Loading from "../../../components/Loading";
import StateMessage from "../../../components/StateMessage";
import { useGetData } from "../../../hooks/useGetData";
import { useGetDate } from "../../../hooks/useGetDateTime";

const PAGE_SIZE = 10;

const rainStatus = (value) => {
  if (!Number.isFinite(Number(value))) return "Data tidak tersedia";
  if (Number(value) < 0.6) return "Hujan ringan";
  if (Number(value) < 2) return "Hujan sedang";
  return "Hujan lebat";
};

const SensorTable = ({ user, stasiun }) => {
  const [sensorData, setSensorData] = useState(null);
  const [totalLength, setTotalLength] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const { getDate, getTime } = useGetDate();
  const { getSensorHistory, isLoading, error } = useGetData();

  const load = useCallback(async () => {
    const token = user ? user.authorization.token : "def";
    const response = await getSensorHistory(
      token,
      pageIndex * PAGE_SIZE,
      PAGE_SIZE,
      stasiun,
    );
    if (response?.data) {
      setSensorData(
        Array.isArray(response.data.history) ? response.data.history : [],
      );
      setTotalLength(Number(response.data.total_count) || 0);
    } else {
      setSensorData(null);
    }
    // getSensorHistory is recreated by the existing hook on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, stasiun, user]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading && sensorData === null)
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
          title="Data sensor tidak dapat dimuat"
          message={error.response?.data?.message || error.message}
          onAction={load}
        />
      </div>
    );
  if (sensorData?.length === 0)
    return (
      <div className="mt-6">
        <StateMessage
          title="Belum ada data sensor"
          message={`Tidak ada catatan curah hujan untuk ${stasiun} pada halaman ini.`}
        />
      </div>
    );
  if (!sensorData) return null;

  const lastPage = Math.max(0, Math.ceil(totalLength / PAGE_SIZE) - 1);
  const start = pageIndex * PAGE_SIZE + 1;
  const end = Math.min(start + sensorData.length - 1, totalLength);
  const valueFor = (item) =>
    stasiun === "Cendono" ? item.curah_hujan_cendono : item.curah_hujan_lawang;

  return (
    <div className="mt-6">
      <div className="grid gap-3 md:hidden">
        {sensorData.map((item) => {
          const value = valueFor(item);
          return (
            <article key={item.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">Catatan #{item.id}</p>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {rainStatus(value)}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Tanggal</dt>
                  <dd className="font-medium">{getDate(item.tanggal)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Jam</dt>
                  <dd className="font-medium">{getTime(item.tanggal)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Curah hujan</dt>
                  <dd className="font-medium">{value ?? "-"} mm</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-blue-50">
            <tr>
              {[
                "ID",
                "Tanggal",
                "Jam",
                "Status curah hujan",
                `CH ${stasiun} (mm)`,
              ].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sensorData.map((item) => {
              const value = valueFor(item);
              return (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">{item.id}</td>
                  <td className="px-4 py-3">{getDate(item.tanggal)}</td>
                  <td className="px-4 py-3">{getTime(item.tanggal)}</td>
                  <td className="px-4 py-3">{rainStatus(value)}</td>
                  <td className="px-4 py-3">{value ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        pageIndex={pageIndex}
        lastPage={lastPage}
        setPageIndex={setPageIndex}
        label={`Menampilkan ${start}-${end} dari ${totalLength}`}
      />
    </div>
  );
};

const Pagination = ({ pageIndex, lastPage, setPageIndex, label }) => (
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
    <p>{label}</p>
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
);

export default SensorTable;
