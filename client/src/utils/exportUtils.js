import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

let cachedRegularFontBase64 = null;
let cachedMediumFontBase64 = null;

/**
 * Convert an ArrayBuffer to Base64
 */
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Load and register Vietnamese Unicode fonts into jsPDF instance
 */
export const registerVietnameseFont = async (doc) => {
  try {
    if (!cachedRegularFontBase64) {
      const res = await fetch('/fonts/Roboto-Regular.ttf');
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        cachedRegularFontBase64 = arrayBufferToBase64(buffer);
      }
    }

    if (!cachedMediumFontBase64) {
      const res = await fetch('/fonts/Roboto-Medium.ttf');
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        cachedMediumFontBase64 = arrayBufferToBase64(buffer);
      }
    }

    if (cachedRegularFontBase64) {
      doc.addFileToVFS('Roboto-Regular.ttf', cachedRegularFontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    }

    if (cachedMediumFontBase64) {
      doc.addFileToVFS('Roboto-Medium.ttf', cachedMediumFontBase64);
      doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
    }

    if (cachedRegularFontBase64 || cachedMediumFontBase64) {
      doc.setFont('Roboto', 'normal');
      return true;
    }
  } catch (error) {
    console.warn('Could not load Roboto font for Vietnamese PDF:', error);
  }
  return false;
};

/**
 * Export data to Excel with proper UTF-8 and column widths
 * @param {Array<Object>} data - Array of row objects
 * @param {string} fileName - File name without or with .xlsx extension
 * @param {string} sheetName - Sheet name
 */
export const exportToExcel = (data, fileName = 'export', sheetName = 'Sheet1') => {
  if (!data || data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto calculate column widths to avoid truncated Vietnamese text
  const colKeys = Object.keys(data[0] || {});
  const colWidths = colKeys.map((key) => {
    let maxLen = key.length;
    data.forEach((row) => {
      const valStr = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const validFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, validFileName, { bookType: 'xlsx', type: 'binary' });
};

/**
 * Export data to PDF with full Vietnamese character support
 * @param {Object} options
 * @param {string} options.title - Document title
 * @param {Array<string>} options.headers - Array of header strings
 * @param {Array<Array<string|number>>} options.rows - 2D Array of table row cell values
 * @param {string} options.fileName - Output PDF filename
 * @param {string} [options.orientation='portrait'] - 'portrait' or 'landscape'
 * @param {string} [options.subtitle] - Optional subtitle (e.g. Export timestamp)
 */
export const exportToPdf = async ({
  title,
  headers,
  rows,
  fileName = 'export.pdf',
  orientation = 'portrait',
  subtitle,
}) => {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  // Register Roboto font for full Unicode/Vietnamese support
  const fontLoaded = await registerVietnameseFont(doc);
  const fontName = fontLoaded ? 'Roboto' : 'helvetica';

  // Title
  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(title, 14, 16);

  // Subtitle / Timestamp
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  const subText = subtitle || `Thời gian xuất: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
  doc.text(subText, 14, 23);

  // Table
  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows,
    styles: {
      font: fontName,
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
    },
    headStyles: {
      font: fontName,
      fontStyle: 'bold',
      fillColor: [59, 130, 246], // Primary blue
      textColor: [255, 255, 255],
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    margin: { left: 14, right: 14 },
  });

  const validFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(validFileName);
};
