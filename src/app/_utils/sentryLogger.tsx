// export const logMessage = async (level: 'info' | 'debug' | 'error' | 'warn', message: string, extra?: any) => {
//     try {
//       await fetch('/api/log', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ level, message, extra }),
//       });
//     } catch (error) {
//       console.error('Failed to log message to server', error);
//     }
//   };
  
export const logSentryMessage = async (level: 'info' | 'debug' | 'error' | 'warn', message: string, extra?: any, comment?: string) => {
  try {
    const logPayload = { level, message, extra };
    if (comment) {
      logPayload['comment'] = comment;
    }
    await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logPayload),
    });
  } catch (error) {
    console.error('Failed to log message to server', error);
  }
};
