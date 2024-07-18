// import { createServer } from "node:http";
import { createServer } from 'http';
import next from 'next'
// import _next from 'next';
// const next = _next as unknown as typeof _next.default;
import { Server } from "socket.io";
// import {query} from "./src/app/api/db.tsx"
// import {query} from "./dist/src/app/api/db.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    // ...
    // console.log(socket.id);


    socket.on('updated', (data) => {
      // console.log("recieved from client")
      io.emit('refresh', data)
    })

    socket.on('replyPost', () => {
      // console.log("recieved reply post")
      io.emit('replyGet')
    })

    // socket.on('subscribeToToken', async (tokenAddress) => {
    //   console.log(`Subscribed to updates for token: ${tokenAddress}`);
      
    //   // Function to check and emit URL updates
    //   const checkAndUpdateURL = async () => {
    //     try {
    //       const result = await query('SELECT dex_url FROM token_list_ftm WHERE token_address = $1', [tokenAddress]);
    //       if (result.length > 0 && result[0].url !== '') {
    //         io.emit(`urlUpdated-${tokenAddress}`, { url: result[0].url });
    //       }
    //     } catch (error) {
    //       console.error('Error checking URL updates:', error);
    //     }
    //   };

    //   // Check for URL updates every 5 seconds
    //   const interval = setInterval(checkAndUpdateURL, 5000);

    //   socket.on('disconnect', () => {
    //     clearInterval(interval);
    //   });
    // });

  });


   


  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      // console.log(`> Ready on http://${hostname}:${port}`);
    });
});