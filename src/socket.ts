// "use client";

// import { io, Socket } from "socket.io-client";

// let socket: Socket | undefined;

// export const getSocket = (): Socket => {
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
        socket = io("http://ec2-13-239-16-108.ap-southeast-2.compute.amazonaws.com:3000"); // Update this line
    }
    return socket;
};