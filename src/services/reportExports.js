import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";

export function exportPDF(title, rows){
  const doc = new jsPDF();
  doc.setFontSize(12); doc.text(title, 10, 10);
  let y = 20;
  rows.forEach(r=>{
    const line = Array.isArray(r) ? r.join(" | ") : (typeof r === 'object' ? JSON.stringify(r) : String(r));
    doc.text(line.substring(0, 120), 10, y);
    y += 6;
    if(y > 270){ doc.addPage(); y = 20; }
  });
  doc.save(`${title}.pdf`);
}

export function exportCSV(title, rows){
  const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${title}.csv`);
}

export function exportExcel(title, jsonRows){
  const ws = XLSX.utils.json_to_sheet(jsonRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' });
  saveAs(new Blob([wbout], { type:'application/octet-stream' }), `${title}.xlsx`);
}

export function exportDOC(title, rows){
  const doc = new Document({
    sections: [{ children: [ new Paragraph({ children: [ new TextRun({ text: title, bold:true }) ] }), ...rows.map(r => new Paragraph({ children: [ new TextRun(String(r)) ] })) ] }]
  });
  Packer.toBlob(doc).then(blob => saveAs(blob, `${title}.docx`));
}
