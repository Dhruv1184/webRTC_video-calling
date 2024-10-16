import express from "express"
import {createServer} from "http"
import { Server } from "socket.io"
import { fileURLToPath } from "url"
import { dirname,join } from "path"

const app = express()
const port = 3000
const server = createServer(app)
const io = new Server(server)
const __dirName = dirname(fileURLToPath(import.meta.url))
const allUser = {}
app.use(express.static("public"))

app.get('/',(req,res)=>{
    console.log("get request send");
    res.sendFile(join(__dirName + '/index.html'))

    
    // res.sendFile()
})

io.on('connection',(socket)=>{
    console.log(`A user connected with socket id ${socket.id}`);
    socket.on("createUser",(data)=>{
        console.log(`${data} joined `)
        allUser[data] = {data,id:socket.id}

        io.emit("joined",allUser)
    })

    socket.on("offer",({from,to,offer})=>{
        console.log({from,to,offer});
        io.to(allUser[to].id).emit("offer",{from,to,offer})
        
    })

    socket.on("answer",({from,to,answer})=>{
        console.log({from,to,answer});
        io.to(allUser[from].id).emit("answer",{from,to,answer}) 
    })
    socket.on("iceCandidate",candidate=>{
        console.log({candidate});
        socket.broadcast.emit("iceCandidate",candidate)
    })

    socket.on("endCall",({from,to})=>{
        console.log({from,to});
        io.to(allUser[to].id).emit("endCall",{from,to})
    })

    socket.on("endCallbtn",caller=>{
        io.to(allUser[caller[0]].id).emit("endCallbtn",caller)
        io.to(allUser[caller[1]].id).emit("endCallbtn",caller)
    })
})

server.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})