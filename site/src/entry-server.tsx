import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App";

export { faqs } from "./sections/Faq";
export { release } from "./lib/release";

export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
