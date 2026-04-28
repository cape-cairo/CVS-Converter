import * as XLSX from 'xlsx';
import { TargetFormat, Mapping, BatchConfig, FieldDefinition } from '../types';

export const parseExcel = (file: File): Promise<{ [sheetName: string]: any[][] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const result: { [sheetName: string]: any[][] } = {};
        workbook.SheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name];
          result[name] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const autoMapFields = (headers: string[], fields: FieldDefinition[]): Mapping => {
  const mapping: Mapping = {};
  const lowerHeaders = headers.map(h => String(h).toLowerCase().trim().replace(/[\s_]/g, ''));

  fields.forEach(field => {
    const fieldLabel = field.label.toLowerCase().replace(/[\s_]/g, '');
    const fieldKey = field.key.toLowerCase().replace(/[\s_]/g, '');

    // Try to find a match
    const index = lowerHeaders.findIndex(h => 
      h.includes(fieldLabel) || 
      h.includes(fieldKey) ||
      fieldLabel.includes(h) ||
      (field.key === 'amount' && (h === 'value' || h === 'total')) ||
      (field.key === 'account_number' && (h.includes('acc') || h.includes('number')))
    );

    if (index !== -1) {
      mapping[field.key] = headers[index];
    }
  });

  return mapping;
};

export const generateCSV = (
  format: TargetFormat,
  data: any[][],
  mapping: Mapping,
  batchConfig: BatchConfig
): string => {
  const headers = data[0] || [];
  const rows = data.slice(1);
  
  const headerToIndex: { [key: string]: number } = {};
  headers.forEach((h, i) => {
    headerToIndex[String(h)] = i;
  });

  const lines: string[] = [];

  // Custom Header (e.g. Bidvest)
  if (format.hasCustomHeader && format.generateCustomHeader) {
    lines.push(format.generateCustomHeader(batchConfig));
  } else if (format.id === 'fnb_standard') {
    // FNB Standard header is the field labels
    lines.push(format.fields.map(f => f.label).join(format.delimiter));
  } else if (format.id === 'bccei') {
    // BCCEI header is exactly as specified
    lines.push(format.fields.map(f => f.label).join(format.delimiter));
  }

  // Row Data
  rows.forEach(row => {
    // Skip empty rows
    if (row.filter(v => v !== null && v !== undefined && v !== '').length === 0) return;

    const mappedRow: { [key: string]: any } = {};
    format.fields.forEach(field => {
      const sourceHeader = mapping[field.key];
      const index = sourceHeader !== undefined ? headerToIndex[sourceHeader] : -1;
      let value = index !== -1 ? row[index] : field.defaultValue;
      
      // Basic formatting
      if (field.key === 'amount' && (typeof value === 'number' || !isNaN(Number(value)))) {
        value = Number(value).toFixed(2);
      }
      
      if (field.key.includes('date') && typeof value === 'number') {
        // Handle Excel dates if they are numeric
        try {
          const date = XLSX.SSF.parse_date_code(value);
          value = `${String(date.d).padStart(2, '0')}/${String(date.m).padStart(2, '0')}/${date.y}`;
        } catch (e) {
          // Fallback to original value if parsing fails
        }
      }

      mappedRow[field.key] = value !== undefined ? value : '';
    });

    if (format.rowFormatter) {
      lines.push(format.rowFormatter(mappedRow, format.fields));
    } else {
      lines.push(format.fields.map(f => {
        let val = String(mappedRow[f.key] || '');
        // Escape delimiter if needed for standard CSV
        if (format.delimiter === ',' && val.includes(',')) {
          val = `"${val}"`;
        }
        return val;
      }).join(format.delimiter));
    }
  });

  return lines.join('\n');
};
