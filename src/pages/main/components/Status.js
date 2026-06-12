import { FaCheck } from "react-icons/fa";

const Status = ({ value }) => {
  const colorMap = {
    Aman: "text-green-700 border-green-200 bg-green-50",
    Siaga: "text-yellow-900 border-yellow-200 bg-yellow-50",
    Bahaya: "border-red-700 bg-red-700 text-white",
    "Tidak tersedia": "border-zinc-200 bg-zinc-50 text-zinc-600",
  };
  return (
    <div
      className={`${colorMap[value] || colorMap["Tidak tersedia"]} rounded-xl border p-3 text-left`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm">Status</p>
          <p className="text-lg font-bold sm:text-xl">{value}</p>
        </div>
        <div className="rounded-full border p-2">
          <FaCheck size={20} />
        </div>
      </div>
    </div>
  );
};

export default Status;
