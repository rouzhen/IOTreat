import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/Dashboard";
import "./index.css";
import MochaDetail from "./pages/MochaDetail";


import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Pets from "./pages/Pets";
import Controls from "./pages/Controls";

const router = createBrowserRouter([
  { path: "/", element: <Dashboard /> },
  { path: "/history", element: <History /> },
  { path: "/pets", element: <Pets /> },
  { path: "/pets/mocha", element: <MochaDetail /> },
  { path: "/controls", element: <Controls /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
