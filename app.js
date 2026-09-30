const KEY="workHours.v1";
const BACKUP_URL=""; // Google Apps Script Web App URL'si buraya gelecek.

function load(){try{return JSON.parse(localStorage.getItem(KEY))||{days:{}}}catch(e){return {days:{}}}}
function save(db){localStorage.setItem(KEY,JSON.stringify(db));}
function pad(n){return String(n).padStart(2,"0")}
function dateKey(d=new Date()){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function fmtTime(v){return v?new Date(v).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}):"—"}
function minsBetween(a,b){return Math.max(0,Math.round((new Date(b)-new Date(a))/60000))}
function hm(m){return `${Math.floor(m/60)}:${pad(m%60)}`}
function monthKeys(){const n=new Date(), y=n.getFullYear(), m=n.getMonth(); let arr=[]; const last=new Date(y,m+1,0).getDate(); for(let d=1;d<=last;d++)arr.push(`${y}-${pad(m+1)}-${pad(d)}`);return arr}
function render(){
 const db=load(), now=new Date(), key=dateKey(now), rec=db.days[key]||{};
 document.getElementById("monthLabel").textContent=now.toLocaleDateString("tr-TR",{month:"long",year:"numeric"});
 document.getElementById("todayDate").textContent=now.toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"});
 document.getElementById("todayStart").textContent=fmtTime(rec.start);
 document.getElementById("todayEnd").textContent=fmtTime(rec.end);
 const total=rec.start&&rec.end?minsBetween(rec.start,rec.end):rec.start?minsBetween(rec.start,new Date()):0;
 document.getElementById("todayTotal").textContent=hm(total);
 document.getElementById("todayStatus").textContent=rec.start&&!rec.end?"Çalışma devam ediyor.":"Henüz giriş yapılmadı.";
 const keys=monthKeys(); let totalMonth=0, work=0;
 for(const k of keys){const r=db.days[k];if(r?.start&&r?.end){totalMonth+=minsBetween(r.start,r.end);work++}}
 document.getElementById("monthTotal").textContent=hm(totalMonth);
 document.getElementById("workDays").textContent=work;
 document.getElementById("average").textContent=work?hm(Math.round(totalMonth/work)):"0:00";
 const box=document.getElementById("days");box.innerHTML="";
 [...keys].reverse().forEach(k=>{
   const r=db.days[k]||{}, d=new Date(k+"T12:00:00"), el=document.createElement("div");el.className="day";
   const dur=r.start&&r.end?hm(minsBetween(r.start,r.end)):(r.start?"Devam ediyor":"OFF / kayıt yok");
   el.innerHTML=`<div class="row"><b>${d.toLocaleDateString("tr-TR",{day:"2-digit",weekday:"short"})}</b><span>${dur}</span></div><small>${fmtTime(r.start)} → ${fmtTime(r.end)}</small>`;
   box.appendChild(el);
 });
 document.getElementById("syncState").textContent=BACKUP_URL?"Drive hazır":"Local";
}
document.getElementById("startBtn").onclick=()=>{
 const db=load(),k=dateKey(); db.days[k]??={};
 if(db.days[k].start&&!db.days[k].end){alert("Bugün zaten giriş yaptın.");return}
 db.days[k].start=new Date().toISOString();db.days[k].end=null;save(db);render();
};
document.getElementById("stopBtn").onclick=()=>{
 const db=load(),k=dateKey();
 if(!db.days[k]?.start){alert("Önce İşe Başla'ya bas.");return}
 if(db.days[k].end){alert("Bugün zaten çıkış yaptın.");return}
 db.days[k].end=new Date().toISOString();save(db);render();
};
document.getElementById("exportBtn").onclick=()=>{
 const blob=new Blob([JSON.stringify(load(),null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`work-hours-${dateKey().slice(0,7)}-backup.json`;a.click();
};
document.getElementById("backupBtn").onclick=async()=>{
 if(!BACKUP_URL){alert("Önce Google Apps Script Web App URL'sini app.js içindeki BACKUP_URL alanına ekleyeceğiz.");return}
 try{document.getElementById("backupInfo").textContent="Yedekleniyor…";
 const r=await fetch(BACKUP_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(load())});
 if(!r.ok)throw new Error("HTTP "+r.status); document.getElementById("backupInfo").textContent="✓ Google Drive yedeği tamamlandı.";
 }catch(e){document.getElementById("backupInfo").textContent="Yedekleme başarısız: "+e.message}
};
render();
setInterval(render,30000);