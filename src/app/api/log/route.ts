// import { NextRequest, NextResponse } from 'next/server';
// import * as Sentry from '@sentry/nextjs';

// export const dynamic = 'force-dynamic';

// export async function POST(req: NextRequest) {
//   try {
//     const { level, message, extra } = await req.json();

//     switch (level) {
//       case 'info':
//         Sentry.captureMessage(message, { level: 'info' });
//         break;
//       case 'debug':
//         Sentry.captureMessage(message, { level: 'debug' });
//         break;
//       case 'warn':
//         Sentry.captureMessage(message, { level: 'warning' });
//         break;
//       case 'error':
//         Sentry.captureException(new Error(message), { extra });
//         break;
//       default:
//         return NextResponse.json({ error: 'Invalid log level' }, { status: 400 });
//     }

//     return NextResponse.json({ success: true }, { status: 200 });
//   } catch (error) {
//     return NextResponse.json({ error: 'Failed to log message to Sentry' }, { status: 500 });
//   }
// }


import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { level, message, extra, comment } = await req.json();

    switch (level) {
      case 'info':
        Sentry.captureMessage(`${message} - ${comment || ''}`, { level: 'info', extra });
        break;
      case 'debug':
        Sentry.captureMessage(`${message} - ${comment || ''}`, { level: 'debug', extra });
        break;
      case 'warn':
        Sentry.captureMessage(`${message} - ${comment || ''}`, { level: 'warning', extra });
        break;
      case 'error':
        Sentry.captureException(new Error(`${message} - ${comment || ''}`), { extra });
        break;
      default:
        return NextResponse.json({ error: 'Invalid log level' }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error); // Capture any unexpected errors in the API route itself
    return NextResponse.json({ error: 'Failed to log message to Sentry' }, { status: 500 });
  }
}
