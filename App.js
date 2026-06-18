import AppRoot from './app/AppRoot';

// Only enable Sentry when configured (avoids blue screen hiding real errors in dev)
let WrappedApp = AppRoot;
try {
  const Sentry = require('@sentry/react-native');
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://placeholder-dsn@o45070267.ingest.sentry.io/4507';
  if (dsn && !dsn.includes('placeholder')) {
    Sentry.init({ dsn, tracesSampleRate: 1.0 });
    WrappedApp = Sentry.wrap(AppRoot);
  }
} catch (_) {}

export default WrappedApp;
