// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://aed9064f5ddf5e7f1f8b33f9fc3a1597@o4507667980615680.ingest.us.sentry.io/4507668044709888",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: process.env.NODE_ENV === 'development',
  beforeSend(event) {
    // Check if the error is the one you want to ignore
    if (event.exception && event.exception.values) {
      const errorMessage = event.exception.values[0].value;
      if (errorMessage && errorMessage.includes("user rejected transaction")) {
        // If the error message matches, return null to drop the event
        return null;
      }
    }
    // Otherwise, return the event to continue sending it
    return event;
  },
  
});
