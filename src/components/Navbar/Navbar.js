import { useEffect, useState } from "react";
import {
  AiFillHome,
  AiOutlineClose,
  AiOutlineHistory,
  AiOutlineMenu,
} from "react-icons/ai";
import { RiAdminFill } from "react-icons/ri";
import { LuLayoutDashboard } from "react-icons/lu";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useLogout } from "../../hooks/useLogout";
import { WATER_LEVEL_STATIONS } from "../../config/stations";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { stasiun } = useParams();
  const { user } = useAuthContext();
  const { logout } = useLogout();
  const historyStation = WATER_LEVEL_STATIONS.some(
    ([, slug]) => slug === stasiun?.toLowerCase(),
  )
    ? stasiun.toLowerCase()
    : "dhompo";

  const items = [
    {
      label: "Utama",
      path: "/",
      icon: AiFillHome,
      active: location.pathname === "/",
    },
    {
      label: "Dashboard",
      path: "/dashboard/Dhompo",
      icon: LuLayoutDashboard,
      active: location.pathname.startsWith("/dashboard"),
    },
    {
      label: "Riwayat",
      path: `/history/${historyStation}`,
      icon: AiOutlineHistory,
      active: location.pathname.startsWith("/history"),
    },
  ];

  if (user?.user?.role === Number(process.env.REACT_APP_ADMIN_ROLE)) {
    items.push({
      label: "Admin",
      path: "/admin",
      icon: RiAdminFill,
      active: location.pathname === "/admin",
    });
  }

  useEffect(() => setIsOpen(false), [location.pathname]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const goTo = (path) => navigate(path);
  const handleLogout = () => logout(user.authorization.token);

  const navigation = (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-5">
        <p className="text-lg font-bold tracking-tight">FFWS Welang</p>
        <p className="mt-1 text-xs text-zinc-500">
          Monitoring dan peringatan banjir
        </p>
      </div>
      <nav className="flex-1 p-4" aria-label="Menu utama">
        <p className="mb-2 px-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Menu utama
        </p>
        <ul className="space-y-1">
          {items.map(({ label, path, icon: Icon, active }) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => goTo(path)}
                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}
              >
                <Icon className="mr-3" aria-hidden="true" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t p-4">
        <button
          type="button"
          onClick={user ? handleLogout : () => goTo("/auth")}
          className={`w-full rounded-lg px-3 py-2 text-sm font-semibold text-white ${user ? "bg-red-700 hover:bg-red-800" : "bg-zinc-900 hover:bg-zinc-700"}`}
        >
          {user ? "Keluar" : "Login Admin"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[1001] flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
        <div className="text-left">
          <p className="font-bold">FFWS Welang</p>
          <p className="text-xs text-zinc-500">Flood Warning System</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg border p-2 text-zinc-700"
          aria-label="Buka menu navigasi"
          aria-expanded={isOpen}
        >
          <AiOutlineMenu size={22} />
        </button>
      </header>

      <aside className="sticky top-0 hidden h-screen w-[250px] flex-none border-r bg-white lg:block">
        {navigation}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-[1100] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup menu navigasi"
          />
          <aside className="relative h-full w-[min(82vw,300px)] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 hover:bg-zinc-100"
              aria-label="Tutup menu navigasi"
            >
              <AiOutlineClose size={20} />
            </button>
            {navigation}
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;
