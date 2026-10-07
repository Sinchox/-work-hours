'use strict';
const pad=n=>String(n).padStart(2,'0');
const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const monthDays=d=>{const n=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();return Array.from({length:n},(_,i)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(i+1)}`)};
const parseHM=(key,hm)=>new Date(`${key}T${hm}:00`).getTime();
function durationMinutes(r){
  if(!r||r.off||!Number.isFinite(r.start)||!Number.isFinite(r.end)) return 0;
  let diff=Math.round((r.end-r.start)/60000);
  if(diff<0) diff+=1440;
  return Math.max(0,diff-Math.max(0,Number(r.breakMin)||0));
}
function formatDuration(m){m=Math.max(0,Math.round(Number(m)||0));return `${Math.floor(m/60)}:${pad(m%60)}`}
function formatTime(ts){return Number.isFinite(ts)?new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(ts)):'—'}
function monthLabel(d){return d.toLocaleDateString('tr-TR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())}
function weekday(k){return new Date(`${k}T12:00:00`).toLocaleDateString('tr-TR',{weekday:'short'}).replace('.','')}
function makeWorkRecord({date,start,end,breakMin=0,note='',shop}){
  const st=parseHM(date,start), enRaw=parseHM(date,end); let en=enRaw;
  // Same clock time means zero duration; an earlier end means an overnight shift.
  if(end<start) en+=86400000;
  return {date,start:st,end:en,breakMin:Math.max(0,Number(breakMin)||0),note:String(note||'').trim(),shop,off:false,archived:false,updatedAt:Date.now()};
}
function makeOffRecord(date,note=''){return {date,start:null,end:null,breakMin:0,note:String(note||'').trim(),shop:'',off:true,archived:false,updatedAt:Date.now()}}
window.WorkRecords={pad,dateKey,monthDays,parseHM,durationMinutes,formatDuration,formatTime,monthLabel,weekday,makeWorkRecord,makeOffRecord};
