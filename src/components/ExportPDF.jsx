import React, { useState } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { API_URL } from '../config.js';

const STAGE_LABELS = {
  APPLIED: 'สมัคร', SCREENING: 'คัดกรอง', INTERVIEW: 'สัมภาษณ์',
  OFFER: 'ยื่นข้อเสนอ', HIRED: 'จ้างงาน', REJECTED: 'ปฏิเสธ',
};

const ExportPDF = ({ job }) => {
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!job?.id) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/export/job/${job.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to fetch export data');
      const data = await res.json();

      // Generate HTML report
      const html = generateHTML(data);

      // Open in new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error('Export error:', err);
      alert('เกิดข้อผิดพลาดในการ export');
    } finally {
      setLoading(false);
    }
  };

  const generateHTML = (data) => `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานการคัดกรองผู้สมัคร - ${data.job.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 2rem; color: #1a1a1a; line-height: 1.6; }
    h1 { font-size: 1.5rem; border-bottom: 3px solid #3b82f6; padding-bottom: 0.5rem; margin-bottom: 1rem; }
    h2 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; color: #374151; border-left: 4px solid #3b82f6; padding-left: 0.5rem; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem 2rem; margin-bottom: 1.5rem; font-size: 0.9rem; }
    .meta span { color: #6b7280; }
    .stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .stat { background: #f3f4f6; padding: 0.75rem 1rem; border-radius: 8px; text-align: center; min-width: 80px; }
    .stat .num { font-size: 1.5rem; font-weight: 700; color: #3b82f6; }
    .stat .label { font-size: 0.75rem; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.85rem; }
    th, td { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    .score { font-weight: 700; color: #3b82f6; }
    .section { margin-bottom: 1.5rem; }
    .interview { padding: 0.5rem; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 0.5rem; }
    @media print { body { padding: 1rem; } }
    .no-print { margin-top: 2rem; text-align: center; }
    .no-print button { padding: 0.75rem 2rem; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; }
  </style>
</head>
<body>
  <h1>📊 รายงานการคัดกรองผู้สมัคร</h1>

  <div class="meta">
    <div><strong>ตำแหน่ง:</strong> ${data.job.title}</div>
    <div><strong>แผนก:</strong> ${data.job.department || '-'}</div>
    <div><strong>สถานที่:</strong> ${data.job.location || '-'}</div>
    <div><strong>ประเภท:</strong> ${data.job.employmentType || '-'}</div>
    <div><strong>เงินเดือน:</strong> ${data.job.salaryRange || '-'}</div>
    <div><strong>สถานะ:</strong> ${data.job.status}</div>
    <div><strong>วันที่ Export:</strong> ${new Date(data.exportedAt).toLocaleString('th-TH')}</div>
    <div><strong>Export โดย:</strong> ${data.exportedBy}</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="num">${data.stats.total}</div><div class="label">ผู้สมัครทั้งหมด</div></div>
    <div class="stat"><div class="num">${data.stats.applied}</div><div class="label">สมัคร</div></div>
    <div class="stat"><div class="num">${data.stats.screening}</div><div class="label">คัดกรอง</div></div>
    <div class="stat"><div class="num">${data.stats.interview}</div><div class="label">สัมภาษณ์</div></div>
    <div class="stat"><div class="num">${data.stats.offer}</div><div class="label">ยื่นข้อเสนอ</div></div>
    <div class="stat"><div class="num">${data.stats.hired}</div><div class="label">จ้างงาน</div></div>
    <div class="stat"><div class="num">${data.stats.rejected}</div><div class="label">ปฏิเสธ</div></div>
  </div>

  ${data.rubrics.length > 0 ? `
  <h2>เกณฑ์การให้คะแนน</h2>
  <table>
    <tr><th>เกณฑ์</th><th>น้ำหนัก</th><th>รายละเอียด</th></tr>
    ${data.rubrics.map(r => `<tr><td>${r.name}</td><td>${r.weight}%</td><td>${r.description || '-'}</td></tr>`).join('')}
  </table>` : ''}

  ${Object.entries(data.pipeline).filter(([_, c]) => c.length > 0).map(([stage, candidates]) => `
  <h2>${STAGE_LABELS[stage] || stage} (${candidates.length} คน)</h2>
  <table>
    <tr><th>ชื่อ</th><th>ตำแหน่ง</th><th>ประสบการณ์</th><th>การศึกษา</th><th>AI Score</th></tr>
    ${candidates.map(c => `<tr>
      <td>${c.name}</td><td>${c.role}</td><td>${c.experience} ปี</td><td>${c.education || '-'}</td>
      <td class="score">${c.aiScore || '-'}</td>
    </tr>`).join('')}
  </table>`).join('')}

  ${data.interviews.length > 0 ? `
  <h2>นัดสัมภาษณ์</h2>
  ${data.interviews.map(i => `
    <div class="interview">
      <strong>${i.candidate}</strong> — สัมภาษณ์โดย ${i.interviewer} | ${new Date(i.scheduledAt).toLocaleString('th-TH')} | ${i.status}
      ${i.score ? ` | คะแนน: ${i.score}` : ''}
      ${i.feedback ? `<br/><em>${i.feedback}</em>` : ''}
    </div>
  `).join('')}` : ''}

  <div class="no-print">
    <button onclick="window.print()">🖨️ พิมพ์ / บันทึกเป็น PDF</button>
  </div>
</body>
</html>`;

  return (
    <button className="btn btn-glow" onClick={generateReport} disabled={loading}>
      <Download size={14} />
      {loading ? 'กำลังสร้าง...' : 'Export PDF Report'}
    </button>
  );
};

export default ExportPDF;
