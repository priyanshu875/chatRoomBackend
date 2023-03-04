const app=require('express')();
const http=require('http').createServer(app);
const { resolveObjectURL } = require('buffer');
const cors=require('cors');
require('dotenv').config();
app.use(cors());
const port=process.env.PORT || 5000


let users=[];
let owners=[];


const io=require('socket.io')(http,{
    cors:{
        origin:"*"
    }
});

app.get('/',(req,res)=>{
    res.json({
        status:true,
        msg:"hey there"
    })
})

io.on("connection",(socket)=>{
    console.log(socket.id);
    ///createRoom
    socket.on("createRoom",(userDet)=>{
        console.log(userDet);
        owners.push({id:socket.id,name:userDet.name,room:userDet.room});
        users.push({id:socket.id,name:userDet.name,room:userDet.room});
        socket.join(userDet.room)
        io.in(userDet.room).emit("roomConfirm",socket.id);
        let activeUsers=users.filter(user=>user.room===userDet.room);
        io.to(userDet.room).emit("activeUsers",activeUsers);
    })
    ////join room
    socket.on("request",(userDet)=>{
        let owner=owners.find(owner=>owner.room===userDet.room);
        if(owner){
            io.to(owner.id).emit("request",({id:socket.id,name:userDet.name,room:userDet.room}));
        }
        else{
            io.to(socket.id).emit("failed","doesnt exist or decline")
        }
    })
    socket.on("accept",(userDet)=>{
        users.push(userDet);
        io.to(userDet.id).emit("accept","success");
    })
    socket.on("i am in",room=>{
        socket.join(room);
        io.to(socket.id).emit("canChat","done");
        let activeUsers=users.filter(user=>user.room===room);
        io.to(room).emit("activeUsers",activeUsers);
    })

    socket.on("chat",msgObj=>{
        console.log(msgObj);
        let obj=users.find(obj=>obj.id===socket.id);
        console.log(obj.room);
        // let activeUsers=users.filter(user=>user.room===obj.room);
        io.to(obj.room).emit("chat",{data:msgObj,name:obj.name});
        
    })
    socket.on("disconnect",(reason)=>{
        console.log(`left socket id ${socket.id}`);
        let userObj=users.find(user=> (user.id===socket.id));
        if(userObj){
            console.log(userObj);
            console.log("gone");
            console.log(reason);
            // console.log(users);
            let tmp=users.filter(user=>user.id!=socket.id);
            users=tmp;
            // console.log(users);
            let tmp2=owners.filter(owner=>owner.id!=socket.id);
            owners=tmp2;
            let activeUsers=users.filter(user=>user.room===userObj.room);
            io.to(userObj.room).emit("activeUsers",activeUsers);
            // console.log(`user size ${userObj.length}`);

        }
    })

})




http.listen(port,()=>{
    console.log(`server started in ${port}`);
})
