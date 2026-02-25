import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

/**
 * Create router with future flags enabled to suppress v7 warnings:
 * - v7_startTransition: Wraps state updates in React.startTransition
 * - v7_relativeSplatPath: Changes relative route resolution in splat routes
 */
const router = createBrowserRouter(
    [
        {
            path: "*",
            element: (
                <AuthProvider>
                    <App />
                </AuthProvider>
            ),
        },
    ],
    {
        future: {
            v7_startTransition: true,
            v7_relativeSplatPath: true,
        },
    }
);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <HelmetProvider>
            <RouterProvider router={router} />
        </HelmetProvider>
    </React.StrictMode>
);
