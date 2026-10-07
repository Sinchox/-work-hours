'use strict';
const DB_NAME='WorkHoursDB', DB_VERSION=8;
const STORE_DAYS='days', STORE_META='meta', STORE_SNAP='snap';
let dbPromise;
function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(STORE_DAYS)) db.createObjectStore(STORE_DAYS,{keyPath:'date'});
      if(!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META,{keyPath:'key'});
      if(!db.objectStoreNames.contains(STORE_SNAP)) db.createObjectStore(STORE_SNAP,{autoIncrement:true});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDB açılamadı'));
  });
  return dbPromise;
}
async function storeGet(store,key){const db=await openDB();return new Promise((res,rej)=>{const q=db.transaction(store).objectStore(store).get(key);q.onsuccess=()=>res(q.result??null);q.onerror=()=>rej(q.error)})}
async function storeAll(store){const db=await openDB();return new Promise((res,rej)=>{const q=db.transaction(store).objectStore(store).getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error)})}
async function storePut(store,value){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).put(value);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
async function storeDelete(store,key){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).delete(key);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
const DB={
  getDay:k=>storeGet(STORE_DAYS,k), allDays:()=>storeAll(STORE_DAYS), putDay:async r=>{await storePut(STORE_DAYS,r);try{await storePut(STORE_SNAP,{at:Date.now(),date:r.date,reason:'change'})}catch{}},
  deleteDay:k=>storeDelete(STORE_DAYS,k),
  getMeta:async k=>(await storeGet(STORE_META,k))?.value,
  setMeta:(k,v)=>storePut(STORE_META,{key:k,value:v}),
  snapshot:()=>storeAll(STORE_SNAP),
  exportAll:async()=>({days:await storeAll(STORE_DAYS),meta:await storeAll(STORE_META)}),
  importAll:async data=>{
    const days=Array.isArray(data?.days)?data.days:[];
    const meta=Array.isArray(data?.meta)?data.meta:[];
    await new Promise((resolve,reject)=>{
      openDB().then(db=>{
        const tx=db.transaction([STORE_DAYS,STORE_META],'readwrite');
        const ds=tx.objectStore(STORE_DAYS), ms=tx.objectStore(STORE_META);
        ds.clear(); ms.clear();
        days.forEach(r=>ds.put(r)); meta.forEach(r=>ms.put(r));
        tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error||new Error('Veri içe aktarılamadı'));
      }).catch(reject);
    });
  },
  clearAll:async()=>{
    await new Promise((resolve,reject)=>{
      openDB().then(db=>{
        const tx=db.transaction([STORE_DAYS,STORE_META],'readwrite');
        tx.objectStore(STORE_DAYS).clear(); tx.objectStore(STORE_META).clear();
        tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error||new Error('Veri temizlenemedi'));
      }).catch(reject);
    });
  }
};
window.WorkDB=DB;
