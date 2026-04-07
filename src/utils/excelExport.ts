import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  fileName: string;
  sheetName?: string;
  headers: string[];
  data: any[][];
  columnWidths?: number[];
}

export const exportToExcel = (options: ExcelExportOptions): void => {
  const { fileName, sheetName = 'Sheet1', headers, data, columnWidths } = options;

  const worksheetData = [headers, ...data];

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  if (columnWidths && columnWidths.length > 0) {
    ws['!cols'] = columnWidths.map(width => ({ wch: width }));
  } else {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    ws['!cols'] = [];
    for (let i = 0; i <= range.e.c; i++) {
      ws['!cols'].push({ wch: 20 });
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, fileName);
};
