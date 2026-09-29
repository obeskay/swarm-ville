import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Boundary } from "./ui/Boundary";
import { Gate } from "./ui/Gate";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <StrictMode>
    <Boundary>
      <Gate>
        <App />
      </Gate>
    </Boundary>
  </StrictMode>
);
