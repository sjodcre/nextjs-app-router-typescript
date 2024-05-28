import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

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
    console.log(socket.id);


    socket.on('updated', (data) => {
      console.log("recieved from client")
      //console.log(data)
      io.emit('refresh', data)
    })

//   socket.on("SubAdd", (data) => {
  //     // console.log('SubAdd event received')
  //     if (data.subs && data.subs.length > 0) {
  //         const channelString = data.subs[0]; // Assuming subs array contains channel strings
  //         // console.log('Channel String:', channelString);

  //         io.emit('channelChange',data.subs[0])
    
  //     }
  // });
    socket.on('replyPost', () => {
      console.log("recieved reply post")
      //console.log(data)
      io.emit('replyGet')
    })


  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});