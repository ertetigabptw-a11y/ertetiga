/**
 * Utility functions for exporting reports in PDF (Print layout) and Excel/CSV formats
 */

export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row
      .map(val => {
        let text = String(val ?? '');
        // Escape quotes
        if (text.search(/("|,|\n)/g) >= 0) {
          text = `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      })
      .join(',');
  };

  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatRupiah(amount?: number | null): string {
  const safeVal = amount === undefined || amount === null || isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeVal);
}

export function openPrintDialog() {
  window.print();
}
