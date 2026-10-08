import http from "node:http";
import crypto from "node:crypto";
import { WebSocketServer } from "ws";

const port=Number(process.env.PORT||8787);
const server=http.createServer((req,res)=>{
  if(req.url==="/health"){
    res.writeHead(200,{"content-type":"application/json","cache-control":"no-store"});
    res.end(JSON.stringify({ok:true,service:"chat-app2-relay",clients:wss.clients.size}));
    return;
  }
  res.writeHead(404,{"content-type":"text/plain"});
  res.end("Chat App 2 relay");
});

const wss=new WebSocketServer({server,maxPayload:8*1024*1024});
const rooms=new Map();
const clients=new Map();

function send(ws,data){
  if(ws.readyState===1)ws.send(JSON.stringify(data));
}
function leave(ws){
  const room=clients.get(ws);
  clients.delete(ws);
  if(!room)return;
  const set=rooms.get(room);
  if(!set)return;
  set.delete(ws);
  if(!set.size)rooms.delete(room);
  else broadcastPresence(room);
}
function broadcastPresence(room){
  const set=rooms.get(room);
  if(!set)return;
  const payload={type:"presence",count:set.size};
  for(const ws of set)send(ws,payload);
}
function broadcast(room,data,except){
  const set=rooms.get(room);
  if(!set)return;
  const payload=JSON.stringify(data);
  for(const ws of set){
    if(ws!==except&&ws.readyState===1)ws.send(payload);
  }
}

wss.on("connection",ws=>{
  ws.isAlive=true;
  ws.userId=crypto.randomUUID();
  ws.on("pong",()=>ws.isAlive=true);

  ws.on("message",(raw,isBinary)=>{
    if(isBinary)return;
    let data;
    try{data=JSON.parse(raw.toString())}catch{return}

    if(data.type==="join"){
      const room=String(data.room||"global").slice(0,80);
      leave(ws);
      if(!rooms.has(room))rooms.set(room,new Set());
      const set=rooms.get(room);
      set.add(ws);
      clients.set(ws,room);
      send(ws,{type:"presence",count:set.size,clientId:ws.userId});
      broadcastPresence(room);
      return;
    }

    const room=clients.get(ws);
    if(!room)return;

    if(data.type==="chat"||data.type==="file"){
      const message={...data,senderId:ws.userId,serverTime:Date.now()};
      broadcast(room,message,ws);
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

server.listen(port,"0.0.0.0",()=>console.log("Chat App 2 relay listening on "+port));