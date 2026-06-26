import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import SpinePreview from "./dev/SpinePreview.jsx";
import "./index.css";

const isSpinePreview = new URLSearchParams(location.search).has("spinePreview");

createRoot(document.getElementById("root")).render(
  <StrictMode>{isSpinePreview ? <SpinePreview /> : <App />}</StrictMode>
);
