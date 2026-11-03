import { registerRootComponent } from "expo";
import App from "./App";
import { reportError } from "./src/errorStore";

// Capture uncaught JS errors so they can be shown on screen (see ErrorBoundary).
try {
  if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
    const prev =
      global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((e, isFatal) => {
      try {
        reportError(e);
      } catch (_) {}
      if (prev) {
        try {
          prev(e, isFatal);
        } catch (_) {}
      }
    });
  }
} catch (_) {}

registerRootComponent(App);
