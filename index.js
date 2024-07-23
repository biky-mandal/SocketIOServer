import express from 'express';
import http from 'http';
import { Server } from "socket.io";

const app = express();
const httpServer = http.createServer(app);


app.get("/", (req, res) => res.send("Express is Running!"));

const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
})

let rooms = [];

io.on("connection", (socket) => {
    console.log(`User Connected! ${socket.id}`)
    socket.on("CreateRoom", (data, callBack) => {

        socket.join(data.room);
        rooms.push({ key: `${socket.id}-Room`, room: data.room, name: data.name, gameData: {
            p1_id: socket.id,
            p2_id: null,
            p1_name: data.name,
            p2_name: null,
            turn: socket.id,
            r1c1: '',
            r1c2: '',
            r1c3: '',
            r2c1: '',
            r2c2: '',
            r2c3: '',
            r3c1: '',
            r3c2: '',
            r3c3: '',
            winner: null,
            roomName: data.room
        }})
        
        callBack({status: true})

        socket.broadcast.emit("Rooms", rooms)
    })

    socket.on("Rooms", (d, callBack) => {
        callBack(rooms);
    })
    // socket.broadcast.emit("Rooms", rooms)

    socket.on("JoinRoom", (data, callBack) => {
        let existingRooms = io.sockets.adapter.rooms;
        let room = existingRooms.get(data.roomName);

        if(room.size == 1){ // There is one person only
            socket.join(data.roomName);
            rooms.map(r => {
                if(r.room === data.roomName){
                    r.gameData.p2_id = socket.id;
                    r.gameData.p2_name = data.name;
                }
            });
        }
        socket.broadcast.emit("Rooms", rooms)
        callBack({status: true})
    })

    socket.on("SetGame", (data) => {
        let gameInfo = {};
        rooms.map(r => {
            if(r.room === data.roomName){
                gameInfo = r.gameData;
            }
        });
        io.to(data.roomName).emit("GameInfo", gameInfo);
    })

    socket.on("ExitGame", (data) => {
        io.to(data.room).emit("GameStatus", {online: false});
    })

    socket.on("Playing", (data) => {
        if (areEqual(data.r1c1, data.r1c2, data.r1c3)) {
            if (data.r1c3 === 'O') data.winner = data.p1_id;
            else data.winner = data.p2_id;
        } else if (areEqual(data.r2c1, data.r2c2, data.r2c3)) {
            if (data.r2c3 === 'O') data.winner = data.p1_id;
            else data.winner = data.p2_id;
        } else if (areEqual(data.r3c1, data.r3c2, data.r3c3)) {
            if (data.r3c3 === 'O') data.winner = data.p1_id;
            else data.winner = data.p2_id;
        } else if (areEqual(data.r1c1, data.r2c1, data.r3c1)) {
            if (data.r3c1 === 'O') data.winner = data.p1_id;
            else data.winner = data.p2_id;
        } else if (areEqual(data.r1c2, data.r2c2, data.r3c2)) {
            if (data.r3c2 === 'O') data.winner = data.p1_id;
            else data.winner = data.p2_id;
        } else if (areEqual(data.r1c3, data.r2c3, data.r3c3)) {
            if (data.r3c3 === 'O') data.winner = data.p1_id;
            else data.winner = data.p2_id;
        } else if (areEqual(data.r1c1, data.r2c2, data.r3c3)) {
            if (data.r3c3 === 'O') data.winner = data.p1_id;
            else data.winner = data.p2_id;
        } else if (areEqual(data.r1c3, data.r2c2, data.r3c1)) {
            if (data.r3c1 === 'O') data.winner = data.p1_id;
            else data.winner = data.p2_id;
        }

        if (
            data.r1c1.length &&
            data.r1c2.length &&
            data.r1c3.length &&
            data.r2c1.length &&
            data.r2c2.length &&
            data.r2c3.length &&
            data.r3c1.length &&
            data.r3c2.length &&
            data.r3c3.length
        ) {
            data.winner === 'NA'
        }
        io.to(data.roomName).emit("GameInfo", data);
    })

    socket.on('disconnect', (data) => {
        socket.disconnect(true);
        socket.broadcast.emit("Rooms", rooms)
        console.log('Disconnect:', socket.id);
    });

})

function areEqual() {
    var len = arguments.length;
    for (var i = 1; i < len; i++) {
        if (!arguments[i].length || arguments[i] !== arguments[i - 1])
            return false;
    }
    return true;
}

httpServer.listen(3000, () => { console.log('Http Connected!') });