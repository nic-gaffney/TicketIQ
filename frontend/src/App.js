import { jsx as _jsx } from "react/jsx-runtime";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
export default function App() {
    return (_jsx(Routes, { children: _jsx(Route, { path: "/", element: _jsx(Home, {}) }) }));
}
