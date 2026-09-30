const DB_NAME="WorkHoursDB";
const DB_VERSION=1;
const STORE="days";

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"date"})};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function getDay(date){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readonly"),s=tx.objectStore(STORE),r=s.get(date);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function putDay(day){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readwrite"),r=tx.objectStore(STORE).put(day);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function allDays(){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readonly"),r=tx.objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}

function pad(n){return String(n).padStart(2,"0")}
function dateKey(d=new Date()){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function fmtTime(v){return v?new Date(v).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}):"—"}
function minsBetween(a,b){return Math.max(0,Math.round((new Date(b)-new Date(a))/60000))}
function hm(m){return `${Math.floor(m/60)}:${pad(m%60)}`}
function monthKeys(){const n=new Date(),y=n.getFullYear(),m=n.getMonth(),a=[],last=new Date(y,m+1,0).getDate();for(let d=1;d<=last;d++)a.push(`${y}-${pad(m+1)}-${pad(d)}`);return a}

async function render(){
 try{
  const all=await allDays(), map=Object.fromEntries(all.map(x=>[x.date,x]));
  const now=new Date(),key=dateKey(now),rec=map[key]||{};
  document.getElementById("monthLabel").textContent=now.toLocaleDateString("tr-TR",{month:"long",year:"numeric"});
  document.getElementById("todayDate").textContent=now.toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"});
  document.getElementById("todayStart").textContent=fmtTime(rec.start);
  document.getElementById("todayEnd").textContent=fmtTime(rec.end);
  const live=rec.start&&!rec.end?minsBetween(rec.start,now):0;
  const total=rec.start&&rec.end?minsBetween(rec.start,rec.end):live;
  document.getElementById("todayTotal").textContent=hm(total);
  document.getElementById("todayStatus").textContent=rec.start&&!rec.end?"Çalışma devam ediyor.":"Henüz giriş yapılmadı.";
  let monthTotal=0,work=0;
  monthKeys().forEach(k=>{const r=map[k];if(r?.start&&r?.end){monthTotal+=minsBetween(r.start,r.end);work++}});
  document.getElementById("monthTotal").textContent=hm(monthTotal);
  document.getElementById("workDays").textContent=work;
  document.getElementById("average").textContent=work?hm(Math.round(monthTotal/work)):"0:00";
  const box=document.getElementById("days");box.innerHTML="";
  [...monthKeys()].reverse().forEach(k=>{
    const r=map[k]||{},d=new Date(k+"T12:00:00"),dur=r.start&&r.end?hm(minsBetween(r.start,r.end)):(r.start?"Devam ediyor":"OFF / kayıt yok");
    const el=document.createElement("div");el.className="day";
    el.innerHTML=`<div class="row"><b>${d.toLocaleDateString("tr-TR",{day:"2-digit",weekday:"short"})}</b><span>${dur}</span></div><small>${fmtTime(r.start)} → ${fmtTime(r.end)}</small>`;
    box.appendChild(el);
  });
  document.getElementById("dbStatus").innerHTML=`<span class="ok">✓ IndexedDB aktif — ${all.length} kayıt saklanıyor.</span>`;
 }catch(e){document.getElementById("dbStatus").innerHTML=`<span class="warn">Veritabanı hatası: ${e.message}</span>`}
}

document.getElementById("startBtn").onclick=async()=>{
 const k=dateKey(),old=await getDay(k);
 if(old?.start&&!old?.end){alert("Bugün zaten giriş yaptın.");return}
 await putDay({date:k,start:new Date().toISOString(),end:null,updatedAt:new Date().toISOString()});
 await render();
};
document.getElementById("stopBtn").onclick=async()=>{
 const k=dateKey(),old=await getDay(k);
 if(!old?.start){alert("Önce İşe Başla'ya bas.");return}
 if(old.end){alert("Bugün zaten çıkış yaptın.");return}
 await putDay({...old,end:new Date().toISOString(),updatedAt:new Date().toISOString()});
 await render();
};
document.getElementById("exportBtn").onclick=async()=>{
 const backup={version:1,exportedAt:new Date().toISOString(),days:await allDays()};
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`work-hours-backup-${dateKey().slice(0,7)}.json`;a.click();
};
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
render();setInterval(render,30000);