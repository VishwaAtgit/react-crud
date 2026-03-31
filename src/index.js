import App from "./App";
import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";
import { fetchUsers } from "./features/users/usersSlice";
import store from "src/store.js";
import { assertNoLeakedSecrets } from './utils/security';
import logger, { setTransport } from './utils/logger';
import { configure as configureMetrics } from './utils/metrics';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logFlagState } from './utils/featureFlags';

// Log feature flag state for audit trail
logFlagState();

// Run secret guard (behavior depends on STRICT_SECRET_GUARD flag)
assertNoLeakedSecrets();


// --- Logging ---------------------------------------------------------------
logger.info('Application starting', {
  env: process.env.NODE_ENV,
  version: process.env.REACT_APP_VERSION || 'dev',
});

// Optional: remote log transport in production
if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_LOG_ENDPOINT) {
  setTransport((entry) => {
    navigator.sendBeacon(
      process.env.REACT_APP_LOG_ENDPOINT,
      JSON.stringify(entry)
    );
  });
}

// --- Metrics ---------------------------------------------------------------
configureMetrics({
  endpoint: process.env.REACT_APP_METRICS_ENDPOINT || null,
  intervalMs: process.env.NODE_ENV === 'production' ? 60_000 : null,
});

// --- Global error capture --------------------------------------------------
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason?.message || String(event.reason),
  });
});

// --- Render ----------------------------------------------------------------
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

store.dispatch(fetchUsers());

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
