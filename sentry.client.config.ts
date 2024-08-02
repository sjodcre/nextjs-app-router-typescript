// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://aed9064f5ddf5e7f1f8b33f9fc3a1597@o4507667980615680.ingest.us.sentry.io/4507668044709888",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  beforeSend(event) {
    // Check if the error is the one you want to ignore
    if (event.exception && event.exception.values) {
      const errorMessage = event.exception.values.map(e => e.value).join(" ");
      if (errorMessage.includes("user rejected transaction")) {
        // If the error message matches, return null to drop the event
        return null;
      }
    }
    // Otherwise, return the event to continue sending it
    return event;
  },

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  // integrations: [
  //   Sentry.replayIntegration({
  //     // Additional Replay configuration goes in here, for example:
  //     maskAllText: true,
  //     blockAllMedia: true,
  //   }),
  // ],
});
