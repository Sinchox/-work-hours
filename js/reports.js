'use strict';
const MONTHS=['Ocak','Subat','Mart','Nisan','Mayis','Haziran','Temmuz','Agustos','Eylul','Ekim','Kasim','Aralik'];
function pdfText(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[İıĞğŞşÜüÖöÇç]/g,c=>({'İ':'I','ı':'i','Ğ':'G','ğ':'g','Ş':'S','ş':'s','Ü':'U','ü':'u','Ö':'O','ö':'o','Ç':'C','ç':'c'}[c]));}
function makePDF(monthDate,rows,total){
  const W=595,H=842,L=42,R=553,B=58,rowH=25;let pages=[],page,y;
  const newPage=()=>{page=[];pages.push(page);y=785;};
  const text=(s,x,yy,size=10,bold=false,color='0.07 0.10 0.16')=>page.push(`${color} rg BT /${bold?'F2':'F1'} ${size} Tf ${x} ${yy} Td (${pdfText(s)}) Tj ET`);
  const rect=(x,yy,w,h,fill)=>page.push(`${fill} rg ${x} ${yy} ${w} ${h} re f`);
  const header=()=>{rect(L,y-rowH+6,R-L,rowH,'0.93 0.95 0.98');text('Tarih',L+9,y-11,9,true);text('Dukkan',L+150,y-11,9,true);text('Baslangic',L+305,y-11,9,true);text('Bitis',L+415,y-11,9,true);y-=rowH;};
  newPage();text('WORK HOURS',L,y,22,true);y-=25;text(`${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`,L,y,12);y-=24;header();
  if(!rows.length){text('Bu ay icin tamamlanmis calisma kaydi yok.',L+8,y-11,10,false,'0.45 0.49 0.56');y-=rowH;}
  for(const r of rows){if(y<B+90){newPage();text('WORK HOURS',L,y,18,true);y-=23;text(`${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`,L,y,10);y-=23;header();}text(r.date,L+9,y-11,9);text(r.shop||'',L+150,y-11,9);text(WorkRecords.formatTime(r.start),L+305,y-11,9);text(WorkRecords.formatTime(r.end),L+415,y-11,9);y-=rowH;}
  if(y<B+90){newPage();}
  const footerY=B; rect(L,footerY,R-L,47,'0.07 0.10 0.16');text('TOPLAM SAAT',L+14,footerY+15,11,true,'1 1 1');text(WorkRecords.formatDuration(total),R-85,footerY+14,14,true,'1 1 1');
  const objs=[];const add=o=>(objs.push(o),objs.length);const f1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');const f2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');const contents=pages.map(p=>add(`<< /Length ${p.join('\n').length} >>\nstream\n${p.join('\n')}\nendstream`));const pagesId=add('');const pageIds=pages.map((_,i)=>add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contents[i]} 0 R >>`));objs[pagesId-1]=`<< /Type /Pages /Kids [${pageIds.map(x=>x+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;const catalog=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);let pdf='%PDF-1.4\n',offs=[0];for(let i=0;i<objs.length;i++){offs[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`}const xref=pdf.length;pdf+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objs.length;i++)pdf+=String(offs[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;return pdf;
}
function downloadPDF(monthDate,rows,total){const pdf=makePDF(monthDate,rows,total);const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=`work-hours-${monthDate.getFullYear()}-${String(monthDate.getMonth()+1).padStart(2,'0')}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
window.WorkReports={downloadPDF};
