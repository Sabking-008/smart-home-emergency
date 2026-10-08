let S={latitude:0,longitude:0};
const $=id=>document.getElementById(id);
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>$("toast").classList.remove("show"),2200)}
async function cmd(url,body=null){
 try{let o={method:"POST",headers:{"Content-Type":"application/json"}};if(body)o.body=JSON.stringify(body);
 let r=await fetch(url,o),d=await r.json();if(!r.ok)throw Error(d.error||"Command failed");toast(d.message||"Command sent");await status()}
 catch(e){toast(e.message)}
}
function angle(v){$("angle").textContent=v+"°"}
function setServo(v){cmd("/api/servo",{angle:Number(v)})}
function paint(s){
 S=s;$("sysBadge").textContent=s.armed?"ARMED":"DISARMED";$("sysBadge").style.color=s.armed?"#ff9999":"#7de8bd";
 $("sys").textContent=s.armed?"System is armed":"System is safe";$("sysText").textContent=s.armed?"Emergency monitoring is active.":"Emergency monitoring is currently disabled.";
 $("alarmBadge").textContent=s.alarm?"ON":"OFF";$("alarmBadge").style.color=s.alarm?"#ff9999":"#7de8bd";$("alarmText").textContent=s.alarm?"Alarm active":"Alarm inactive";
 $("fire").textContent=s.fire?"FIRE ALERT":"SAFE";$("fire").style.color=s.fire?"#ed5754":"#27c98a";$("fireD").textContent=s.fire?"Fire detected":"No fire detected";
 $("vib").textContent=s.vibration?"DETECTED":"NORMAL";$("vib").style.color=s.vibration?"#f2aa43":"#27c98a";$("vibD").textContent=s.vibration?"Vibration detected":"No vibration detected";
 $("dist").textContent=Number(s.distance||0).toFixed(1);
 let a=Math.round(Number(s.servo||0));$("servo").textContent=a;$("slider").value=a;$("angle").textContent=a+"°";$("gate").textContent=a>=90?"Open":"Closed";$("gateBadge").textContent=a>=90?"OPEN":"CLOSED";
 $("lat").textContent=Number(s.latitude||0).toFixed(6);$("lon").textContent=Number(s.longitude||0).toFixed(6);$("sat").textContent=Math.round(s.satellites||0);$("speed").textContent=Number(s.speed||0).toFixed(1);
 let m=s.mpu||{};$("mpu").innerHTML=["ax","ay","az","gx","gy","gz"].map(k=>`<div><span>${k.toUpperCase()}</span><b>${Number(m[k]||0).toFixed(2)}</b></div>`).join("");
 $("dot").className=s.online?"on":"";$("conn").textContent=s.online?"ESP8266 Online":"ESP8266 Offline";$("dev").textContent=s.online?"Online":"Offline";
 let t=s.lastSeen?new Date(s.lastSeen).toLocaleTimeString():"Never";$("seen").textContent=s.lastSeen?"Last update: "+t:"Waiting for device";$("last").textContent=t;
}
async function status(){try{let r=await fetch("/api/status",{cache:"no-store"});paint(await r.json())}catch(e){}}
function map(){if(!S.latitude||!S.longitude)return toast("GPS coordinates not available");window.open("https://www.google.com/maps?q="+S.latitude+","+S.longitude,"_blank")}
function loadCam(){let u=$("camUrl").value.trim();try{new URL(u)}catch{return toast("Enter a valid camera URL")}localStorage.cam=u;$("cam").src=u;$("cam").hidden=false;$("camBox").hidden=true;toast("Camera loaded")}
if(localStorage.cam)$("camUrl").value=localStorage.cam;
status();setInterval(status,2000);
