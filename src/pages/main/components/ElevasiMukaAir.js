import { IoMdClock } from "react-icons/io";
import { useGetDate } from "../../../hooks/useGetDateTime";
import { useEffect, useState } from "react";
const ElevasiMukaAir = () => {
  const [time, setTime] = useState(new Date());
  const { getDayName, getTime } = useGetDate();

  useEffect(() => {
    const intervalID = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Clear the interval on component unmount
    return () => clearInterval(intervalID);
  }, []);

  return (
    <div className="rounded-xl border bg-white p-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm">
            {getDayName(time) + ", " + time.toISOString().slice(0, 10)}
          </p>
          <p className="text-lg font-bold sm:text-xl">{getTime(time)}</p>
        </div>
        <div className="rounded-full border">
          <IoMdClock size={40} />
        </div>
      </div>
    </div>
  );
};

export default ElevasiMukaAir;
