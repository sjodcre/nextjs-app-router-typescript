// "use client";

// import { io } from "socket.io-client";


// let socket;

// export const getSocket = () => {
//     if (!socket) {
//         socket = io();
//     }
//     return socket;
// };

"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | undefined;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io();
    }
    return socket;
};
