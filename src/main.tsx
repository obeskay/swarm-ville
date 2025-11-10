import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // StrictMode disabled temporarily due to PixiJS double-mount issue
  // <React.StrictMode>
  <App />,
  // </React.StrictMode>
);
