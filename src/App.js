import "./App.css";
import Navbar from "./components/Navbar/Navbar.js";
import Main from "./pages/main/Main";
import History from "./pages/history/History";
import Map from "./pages/map/Map";
import Auth from "./pages/auth/Auth";
import Admin from "./pages/admin/Admin.js";
import NotFound from "./components/NotFound.js";
import PrivateRoute from "./private-route/PrivateRoute";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

const basename = process.env.PUBLIC_URL || "/tsipil/informasibanjir/ffws";

function App() {
  const router = createBrowserRouter(
    [
      { path: "/auth", element: <Auth /> },
      { path: "/", element: <Wrapper child={<Map />} /> },
      { path: "/history/:stasiun", element: <Wrapper child={<History />} /> },
      { path: "/dashboard/:stasiun", element: <Wrapper child={<Main />} /> },
      {
        path: "/admin",
        element: (
          <PrivateRoute>
            <Wrapper child={<Admin />} />
          </PrivateRoute>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
    { basename },
  );
  return <RouterProvider router={router} />;
}

const Wrapper = ({ child }) => {
  return (
    <div className="App flex min-h-screen w-full bg-zinc-50 font-sans text-zinc-900">
      <Navbar />
      <main className="min-w-0 flex-1 px-4 pb-8 pt-20 sm:px-6 lg:h-screen lg:overflow-y-auto lg:px-8 lg:py-6">
        <div className="mx-auto w-full max-w-[1600px]">{child}</div>
      </main>
    </div>
  );
};

export default App;
