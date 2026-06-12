import { FaWater } from "react-icons/fa";
const LevelMukaAir = ({ value }) => {
  return (
    <div className="rounded-xl border bg-white p-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm">Tinggi Muka Air</p>
          <p className="text-lg font-bold sm:text-xl">
            {Number.isFinite(Number(value)) ? value : "-"}{" "}
            <s className="no-underline text-base font-light">m</s>
          </p>
        </div>
        <div className="rounded-full border p-2">
          <FaWater size={20} className="text-cyan-400" />
        </div>
      </div>
    </div>
  );
};

export default LevelMukaAir;
