import http from "node:http";
import { WebSocketServer } from "ws";

const port=Number(process.env.PORT||8787);
const server=http.createServer((req,res)=>{
  if(req.url==="/health"){
    res.writeHead(200,{"content-type":"application/json"});
    res.end(JSON.stringify({ok:true,service:"chat-app2-relay"}));
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const wss=new WebSocketServer({server,maxPayload:8*1024*1024});
const rooms=new Map();
const clients=new Map();

function send(ws,data){
  if(ws.readyState===1)ws.send(JSON.stringify(data));
}
function leave(ws){
  const room=clients.get(ws);
  if(!room)return;
  clients.delete(ws);
  const set=rooms.get(room);
  if(!set)return;
  set.delete(ws);
  if(!set.size)rooms.delete(room);
  else for(const peer of set)send(peer,{type:"presence",count:set.size});
}
function broadcast(room,data,except){
  const set=rooms.get(room);
  if(!set)return;
  const payload=JSON.stringify(data);
  for(const peer of set){
    if(peer!==except&&peer.readyState===1)peer.send(payload);
  }
}

wss.on("connection",ws=>{
  ws.isAlive=true;
  ws.on("pong",()=>ws.isAlive=true);

  ws.on("message",(raw,isBinary)=>{
    if(isBinary)return;
    let data;
    try{data=JSON.parse(raw.toString())}catch{return}
    if(data.type==="join"){
      const room=String(data.room||"global").slice(0,80);
      leave(ws);
      if(!rooms.has(room))rooms.set(room,new Set());
      rooms.get(room).add(ws);
      clients.set(ws,room);
      send(ws,{type:"presence",count:rooms.get(room).size});
      broadcast(room,{type:"presence",count:rooms.get(room).size},ws);
      return;
    }
    const room=clients.get(ws);
    if(!room)return;
    if(data.type==="chat"||data.type==="file"){
      broadcast(room,data,ws);
    }
  });

  ws.on("close",()=>leave(ws));
  ws.on("error",()=>leave(ws));
});

setInterval(()=>{
  for(const ws of wss.clients){
    if(ws.isAlive===false){ws.terminate();continue}
    ws.isAlive=false;
    ws.ping();
  }
},30000);

server.listen(port,()=>console.log("Chat App 2 relay listening on "+port));
