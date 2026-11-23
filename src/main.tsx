import React from "react";
import { createRoot } from "react-dom/client";
import { createRootRoute, createRoute, createRouter, createHashHistory, Outlet, RouterProvider } from "@tanstack/react-router";
import { AppShell } from "./components/ritm/AppShell";
import { TodayScreen } from "./components/ritm/TodayScreen";
import { StatsScreen } from "./components/ritm/StatsScreen";
import "./styles.css";

const root = createRootRoute({ component: () => <AppShell><Outlet /></AppShell> });
const today = createRoute({ getParentRoute: () => root, path: "/", component: TodayScreen });
const stats = createRoute({ getParentRoute: () => root, path: "/stats", component: StatsScreen });
const router = createRouter({ routeTree: root.addChildren([today, stats]), history: createHashHistory() });
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
