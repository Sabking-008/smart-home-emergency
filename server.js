const express=require("express");
const path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
const KEY=process.env.ESP_DEVICE_KEY||"change-this-key";

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

let state={
  online:false,lastSeen:null,armed:false,alarm:false,fire:false,vibration:false,
  distance:0,servo:0,latitude:0,longitude:0,satellites:0,speed:0,
  mpu:{ax:0,ay:0,az:0,gx:0,gy:0,gz:0}
};
let commands=[];

function espAuth(req,res,next){
  if((req.get("x-esp-key")||"")!==KEY)
    return res.status(401).json({success:false,error:"Unauthorized"});
  next();
}
function addCommand(command,value=null){
  commands.push({id:Date.now()+"-"+Math.random().toString(36).slice(2,7),command,value});
  if(commands.length>30) commands.shift();
}

app.get("/api/status",(req,res)=>{
  const s=JSON.parse(JSON.stringify(state));
  s.online=s.lastSeen ? Date.now()-new Date(s.lastSeen).getTime()<20000 : false;
  res.json(s);
});

const simple={
 "/api/arm":["ARM",()=>state.armed=true,"ARM command queued"],
 "/api/disarm":["DISARM",()=>state.armed=false,"DISARM command queued"],
 "/api/alarm/on":["ALARM_ON",()=>state.alarm=true,"Alarm ON command queued"],
 "/api/alarm/off":["ALARM_OFF",()=>state.alarm=false,"Alarm OFF command queued"],
 "/api/fire/sound":["FIRE_SOUND",()=>{},"Fire warning queued"],
 "/api/gate/open":["SERVO",()=>state.servo=180,"Gate OPEN command queued"],
 "/api/gate/close":["SERVO",()=>state.servo=0,"Gate CLOSE command queued"]
};
for(const [route,[cmd,change,msg]] of Object.entries(simple))
  app.post(route,(req,res)=>{change();addCommand(cmd,cmd==="SERVO"?state.servo:null);res.json({success:true,message:msg});});

app.post("/api/servo",(req,res)=>{
  let a=Number(req.body.angle);
  if(!Number.isFinite(a)) return res.status(400).json({success:false,error:"Invalid angle"});
  a=Math.max(0,Math.min(180,Math.round(a)));
  state.servo=a; addCommand("SERVO",a);
  res.json({success:true,message:"Servo command queued",angle:a});
});

app.post("/api/esp/status",espAuth,(req,res)=>{
  const b=req.body||{};
  for(const k of ["armed","alarm","fire","vibration"])
    if(typeof b[k]==="boolean") state[k]=b[k];
  for(const k of ["distance","servo","latitude","longitude","satellites","speed"])
    if(b[k]!==undefined && Number.isFinite(Number(b[k]))) state[k]=Number(b[k]);
  if(b.mpu) for(const k of ["ax","ay","az","gx","gy","gz"])
    if(b.mpu[k]!==undefined && Number.isFinite(Number(b.mpu[k]))) state.mpu[k]=Number(b.mpu[k]);
  state.online=true; state.lastSeen=new Date().toISOString();
  res.json({success:true});
});

app.get("/api/esp/commands",espAuth,(req,res)=>{
  state.online=true; state.lastSeen=new Date().toISOString();
  const out=commands; commands=[];
  res.json({success:true,commands:out});
});

app.get("/api/esp/heartbeat",espAuth,(req,res)=>{
  state.online=true; state.lastSeen=new Date().toISOString();
  res.json({success:true});
});

app.get("/health",(req,res)=>res.json({ok:true}));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log("Smart Home running on port "+PORT));