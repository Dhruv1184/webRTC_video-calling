const createUserBtn = document.getElementById("create-user");
const userName = document.getElementById("username");
const allusersDiv = document.getElementById("allusers")
const localVideo = document.getElementById("localVideo")
const remoteVideo = document.getElementById("remoteVideo")
const endCallBtn = document.getElementById("end-call-btn");
const socket = io()
let localStream
let caller = []
const peerConnection = (function(){
    let peerConnection;

    const createPeerConnection = () =>{
        const config = {
            iceServers : [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        }
        peerConnection = new RTCPeerConnection(config);

        // listen local stream
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track,localStream)
        });

        // listen Remote stream
        peerConnection.ontrack = function(e) {
            remoteVideo.srcObject = e.streams[0]
        } 

        // listen ice candidate
        peerConnection.onicecandidate = function(e) {
            if(e.candidate){
                socket.emit("iceCandidate",e.candidate)
            }
        }

        return peerConnection
    }
    return {
        getInstance : ()=>{
            if(!peerConnection){
                peerConnection = createPeerConnection()
            }
            return peerConnection
        }
    }
})()

createUserBtn.addEventListener("click",(e)=>{
    if(userName.value != ""){        
        const userNameContainer = document.querySelector(".username-input")
        socket.emit("createUser",userName.value);
        userNameContainer.style.display = "none";
        
    }
})

endCallBtn.addEventListener("click",(e)=>{
    socket.emit("endCallbtn",caller)
})
socket.on("offer", async ({from,to,offer})=>{
    const pc = peerConnection.getInstance()
    await pc.setRemoteDescription(offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket.emit("answer",({from,to,answer: pc.localDescription}))
    caller = [from,to]
})


socket.on("answer",async ({from,to,answer})=>{
    const pc = peerConnection.getInstance()
    await pc.setRemoteDescription(answer)

    endCallBtn.style.display = "block"
    endCallBtn.style.borderRadius = '0'
    endCallBtn.style.padding = '4px'
    endCallBtn.style.margin = '20px'
    endCallBtn.style.width = "max-content"

    socket.emit("endCall",{from,to})
    caller = [from,to]

})

socket.on("iceCandidate",async (candidate)=>{
    console.log(candidate);
    
    const pc = peerConnection.getInstance()
    await pc.addIceCandidate(new RTCIceCandidate(candidate))
})

socket.on("endCall",({from,to})=>{
    endCallBtn.style.display = "block "

})
socket.on("joined",allUser=>{
    console.log(allUser)

    const createUserList = ()=>{
        allusersDiv.innerHTML = ""
        for(const user in allUser){
            const li = document.createElement("li");
            li.textContent = `${user} ${user == userName.value ? "(You)" : ""}`

            if(user != userName.value){
                const callButton = document.createElement('button')
                callButton.classList.add("call-btn")
                callButton.textContent = "Call"
                callButton.style.border = "1px solid black"
                callButton.style.margin = "4px"
                callButton.style.padding = "4px"

                callButton.addEventListener('hover',(e)=>{
                    callButton.style.cursor = "pointer"
                })
                callButton.addEventListener("click",(e)=>{
                    startCall(user)
                })
                li.appendChild(callButton)
            }
            allusersDiv.appendChild(li)

        }
    }

    createUserList()
})

socket.on("endCallbtn",(caller)=>{
    endCall()
})

const startCall = async (user)=>{
    console.log(user);
    const pc = peerConnection.getInstance()
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit("offer",{
        from: userName.value,
        to: user,
        offer:pc.localDescription
    })    
}

const startMyVideo = async ()=>{
    try {
        const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true})
        console.log(stream);
        localStream = stream
        localVideo.srcObject = stream
    } catch (error) {
        console.log(error);
        
    }
}

const endCall = ()=>{
    const pc = peerConnection.getInstance()
    if(pc){
        pc.close()
        endCallBtn.style.display = "none"
    }
}

startMyVideo()