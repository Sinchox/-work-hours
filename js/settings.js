'use strict';
const settingPages={
  stores:{title:'Dükkan Yönetimi',sub:'Aktif dükkanlar ve varsayılan seçim',body:()=>`<div class="settings-detail-list"><div class="detail-item"><strong>Ederle</strong><span>Aktif</span></div><div class="detail-item"><strong>DelDin</strong><span>Aktif</span></div></div><div class="detail-note">Bu sürümde kayıtlar Ederle ve DelDin seçenekleriyle tutulur.</div>`},
  work:{title:'Çalışma Ayarları',sub:'Günlük hedef ve mola varsayılanı',body:()=>`<div class="field"><label for="detailTarget">Günlük normal çalışma saati</label><input id="detailTarget" type="number" min="0" step="0.25" value="${Number(WorkSettings._target??8)}"></div><div class="field"><label for="defaultBreak">Varsayılan mola (dakika)</label><input id="defaultBreak" type="number" min="0" step="5" value="${Number(WorkSettings._break??0)}"></div><button class="save" id="detailWorkSave">Kaydet</button>`},
  pay:{title:'Ücret Ayarları',sub:'Saatlik ücret ve ek ödeme',body:()=>`<div class="field"><label for="detailRate">Saatlik ücret (€)</label><input id="detailRate" type="number" min="0" step="0.01" value="${Number(WorkSettings._rate??0)}"></div><div class="field"><label for="monthlyBonus">Aylık ek ödeme (€)</label><input id="monthlyBonus" type="number" min="0" step="0.01" value="${Number(WorkSettings._bonus??0)}"></div><button class="save" id="detailPaySave">Kaydet</button>`},
  report:{title:'Rapor Ayarları',sub:'PDF rapor görünümü',body:()=>`<div class="detail-note">PDF raporu A4, yüksek kontrast ve seçili ay formatında hazırlanır.</div><div class="detail-item"><strong>Format</strong><span>PDF / A4</span></div>`},
  notifications:{title:'Bildirimler',sub:'Hatırlatıcı tercihleri',body:()=>`<label class="switch-row"><span><strong>Hatırlatıcılar</strong><small>Bildirim tercihini sakla</small></span><input id="notifyToggle" type="checkbox" ${WorkSettings._notify?'checked':''}><span class="switch"></span></label><div class="detail-note">Tarayıcı bildirimleri cihaz ve iOS izinlerine bağlıdır.</div>`},
  appearance:{title:'Görünüm',sub:'Tema tercihi',body:()=>`<div class="theme-grid"><button class="theme-choice ${WorkSettings._theme==='light'?'selected':''}" data-theme="light">Açık</button><button class="theme-choice ${WorkSettings._theme==='dark'?'selected':''}" data-theme="dark">Koyu</button><button class="theme-choice ${WorkSettings._theme==='auto'?'selected':''}" data-theme="auto">Sistem</button></div>`},
  data:{title:'Veri Yönetimi',sub:'Yedekleme ve veri temizleme',body:()=>`<button class="data-action" id="exportJson">JSON yedeği oluştur</button><button class="data-action" id="exportCsv">CSV dışa aktar</button><label class="data-action file-action">JSON yedeğini içe aktar<input id="importJson" type="file" accept="application/json" hidden></label><button class="data-action danger" id="clearData">Tüm çalışma verilerini sil</button><div class="detail-note">Yedek dosyası kayıtları ve ayarları içerir.</div>`},
  about:{title:'Hakkında',sub:'Sürüm ve bilgiler',body:()=>`<div class="about-card"><strong>Work Hours V8</strong><span>Offline + IndexedDB</span><span>Geliştirici: Sincho</span><span>Lisans: Kişisel kullanım</span></div>`}
};
async function renderSettings(){
  WorkSettings._target=await WorkDB.getMeta('target')??8;
  WorkSettings._rate=await WorkDB.getMeta('rate')??0;
  WorkSettings._break=await WorkDB.getMeta('defaultBreak')??0;
  WorkSettings._bonus=await WorkDB.getMeta('bonus')??0;
  WorkSettings._notify=!!(await WorkDB.getMeta('notify'));
  WorkSettings._theme=await WorkDB.getMeta('theme')||'light';
  document.getElementById('dailyTarget').value=WorkSettings._target;
  document.getElementById('hourlyRate').value=WorkSettings._rate;
  applyTheme(WorkSettings._theme);
}
async function saveGeneralSettings(){
  await WorkDB.setMeta('target',Number(document.getElementById('dailyTarget').value)||8);
  await WorkDB.setMeta('rate',Number(document.getElementById('hourlyRate').value)||0);
  UI.showToast('Ayarlar kaydedildi');
}
function applyTheme(theme){document.documentElement.dataset.theme=theme;}
async function openPage(key){
  const cfg=settingPages[key]; if(!cfg)return;
  await renderSettings();
  const body=document.getElementById('settingsDetailBody');
  document.getElementById('settingsDetailTitle').textContent=cfg.title;
  document.getElementById('settingsDetailSub').textContent=cfg.sub;
  body.innerHTML=cfg.body();
  document.getElementById('settingsDetail').classList.add('open');
  body.querySelector('#detailWorkSave')?.addEventListener('click',async()=>{
    await WorkDB.setMeta('target',Number(body.querySelector('#detailTarget').value)||8);
    await WorkDB.setMeta('defaultBreak',Math.max(0,Number(body.querySelector('#defaultBreak').value)||0));
    await renderSettings(); await window.refreshApp?.(); UI.showToast('Çalışma ayarları kaydedildi');
  });
  body.querySelector('#detailPaySave')?.addEventListener('click',async()=>{
    await WorkDB.setMeta('rate',Number(body.querySelector('#detailRate').value)||0);
    await WorkDB.setMeta('bonus',Number(body.querySelector('#monthlyBonus').value)||0);
    await renderSettings(); await window.refreshApp?.(); UI.showToast('Ücret ayarları kaydedildi');
  });
  body.querySelector('#notifyToggle')?.addEventListener('change',async e=>{
    await WorkDB.setMeta('notify',e.target.checked);
    UI.showToast(e.target.checked?'Bildirim tercihi açıldı':'Bildirim tercihi kapatıldı');
  });
  body.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',async()=>{
    const t=b.dataset.theme; await WorkDB.setMeta('theme',t); applyTheme(t); await openPage('appearance'); UI.showToast('Görünüm kaydedildi');
  }));
  body.querySelector('#exportJson')?.addEventListener('click',exportJSON);
  body.querySelector('#exportCsv')?.addEventListener('click',exportCSV);
  body.querySelector('#importJson')?.addEventListener('change',importJSON);
  body.querySelector('#clearData')?.addEventListener('click',clearData);
}
async function exportJSON(){
  const data=await WorkDB.exportAll();
  const blob=new Blob([JSON.stringify({version:8,exportedAt:new Date().toISOString(),...data},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url; a.download=`work-hours-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),3000); UI.showToast('JSON yedeği hazır');
}
async function exportCSV(){
  const rows=(await WorkDB.allDays()).filter(r=>!r.off&&!r.archived&&r.start&&r.end).sort((a,b)=>a.date.localeCompare(b.date));
  const escCsv=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const lines=[['Tarih','Dükkan','Başlangıç','Bitiş','Mola (dk)','Süre','Not'].map(escCsv).join(',')];
  for(const r of rows) lines.push([r.date,r.shop,WorkRecords.formatTime(r.start),WorkRecords.formatTime(r.end),r.breakMin||0,WorkRecords.formatDuration(WorkRecords.durationMinutes(r)),r.note||''].map(escCsv).join(','));
  const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`work-hours-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);UI.showToast('CSV hazır');
}
async function importJSON(e){
  const f=e.target.files?.[0]; if(!f)return;
  try{
    const data=JSON.parse(await f.text());
    if(!Array.isArray(data.days)||!Array.isArray(data.meta))throw new Error('Geçersiz yedek');
    if(!confirm('Mevcut kayıtlar yedekle değiştirilecek. Devam edilsin mi?'))return;
    await WorkDB.importAll(data); await renderSettings(); await window.refreshApp?.(); UI.showToast('Yedek geri yüklendi');
  }catch(err){console.error(err);UI.showToast('Yedek yüklenemedi','error');}
  finally{e.target.value='';}
}
async function clearData(){
  if(!confirm('Tüm çalışma kayıtları ve ayarlar silinsin mi? Bu işlem geri alınamaz.'))return;
  await WorkDB.clearAll(); await renderSettings(); await window.refreshApp?.(); UI.showToast('Veriler temizlendi');
}
function closePage(){document.getElementById('settingsDetail').classList.remove('open');}
window.WorkSettings={renderSettings,saveGeneralSettings,openPage,closePage,applyTheme};
