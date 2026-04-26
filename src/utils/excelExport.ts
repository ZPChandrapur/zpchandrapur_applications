import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  fileName: string;
  sheetName?: string;
  headers: string[];
  data: any[][];
  columnWidths?: number[];
}

export interface StyledExcelExportOptions extends ExcelExportOptions {
  title?: string;
  subtitle?: string;
  font?: {
    name?: string;
    size?: number;
  };
  includeStyles?: boolean;
}

// Enhanced export with Marathi font support and styling
export const exportToExcelWithStyle = (options: StyledExcelExportOptions): void => {
  const { 
    fileName, 
    sheetName = 'Sheet1', 
    headers, 
    data, 
    columnWidths,
    title,
    font = { name: 'Devanagari', size: 11 },
    includeStyles = true
  } = options;

  const worksheetData: any[][] = [];

  // Add title if provided
  if (title && includeStyles) {
    worksheetData.push([title]);
    worksheetData.push([]); // Empty row
  }

  // Add headers and data
  worksheetData.push(headers, ...data);

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  if (columnWidths && columnWidths.length > 0) {
    ws['!cols'] = columnWidths.map(width => ({ wch: width }));
  } else {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    ws['!cols'] = [];
    for (let i = 0; i <= range.e.c; i++) {
      ws['!cols'].push({ wch: 22 });
    }
  }

  // Apply styling if enabled
  if (includeStyles) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Apply styles to title
    if (title) {
      const titleCell = ws['A1'];
      if (titleCell) {
        titleCell.s = {
          font: {
            bold: true,
            size: 14,
            name: font.name || 'Devanagari'
          },
          fill: { fgColor: { rgb: 'FF3B82F6' } }, // Blue background
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
        };
      }
      // Merge title cells
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }];
    }

    // Apply header styling (starting from row 2 if title exists, else row 0)
    const headerRowIndex = title ? 2 : 0;
    for (let col = 0; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
      const cell = ws[cellRef];
      if (cell) {
        cell.s = {
          font: {
            bold: true,
            size: font.size || 11,
            name: font.name || 'Devanagari',
            color: { rgb: 'FFFFFFFF' }
          },
          fill: { fgColor: { rgb: 'FF1F2937' } }, // Dark gray background
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            left: { style: 'thin', color: { rgb: 'FF000000' } },
            right: { style: 'thin', color: { rgb: 'FF000000' } }
          }
        };
      }
    }

    // Apply data row styling
    const dataStartRow = title ? 3 : 1;
    for (let row = dataStartRow; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[cellRef];
        if (cell) {
          // Alternate row colors for better readability
          const bgColor = (row - dataStartRow) % 2 === 0 ? 'FFF9FAFB' : 'FFFFFFFF';
          
          cell.s = {
            font: {
              size: font.size || 11,
              name: font.name || 'Devanagari'
            },
            fill: { fgColor: { rgb: bgColor } },
            alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
              bottom: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
              left: { style: 'thin', color: { rgb: 'FFE5E7EB' } },
              right: { style: 'thin', color: { rgb: 'FFE5E7EB' } }
            }
          };
        }
      }
    }

    // Set row heights
    ws['!rows'] = [];
    if (title) {
      ws['!rows'][0] = { hpt: 30 }; // Title row
      ws['!rows'][2] = { hpt: 25 }; // Header row
    } else {
      ws['!rows'][0] = { hpt: 25 }; // Header row
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, fileName);
};

// Original simple export function
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
