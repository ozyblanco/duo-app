import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction } from '@/types';
import { mockCategories } from '@/data/mockData';

function getCategoryName(categoryId?: string) {
  if (!categoryId) return 'General';
  const cat = mockCategories.find((c) => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

interface ExportOptions {
  currentUserName: string;
  partnerName: string;
  currentUserId?: string;
  periodLabel?: string;
}

// 1. Exportación a Excel / CSV con compatibilidad UTF-8
export function exportToCSV(transactions: Transaction[], options: ExportOptions) {
  const headers = ['Fecha', 'Concepto', 'Categoría', 'Pagado Por', 'División', 'Monto USD'];

  const rows = transactions.map((tx) => {
    const isUser = tx.paidByUserId === options.currentUserId;
    const payerName = isUser ? options.currentUserName : options.partnerName;
    const catName = getCategoryName(tx.categoryId);
    const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('es-ES') : 'N/A';
    const splitStr = `${tx.splitRatio?.userA ?? 50}/${tx.splitRatio?.userB ?? 50}`;

    return [
      `"${dateStr}"`,
      `"${tx.title.replace(/"/g, '""')}"`,
      `"${catName}"`,
      `"${payerName}"`,
      `"${splitStr}"`,
      tx.amount.toFixed(2),
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const fileName = `DUO_Reporte_${new Date().toISOString().substring(0, 10)}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 2. Exportación a PDF estructurado y estilizado
export function exportToPDF(
  transactions: Transaction[],
  categoryStats: { categoryName: string; total: number; percentage: number; count: number }[],
  summary: { totalSpent: number; userTotal: number; partnerTotal: number; dailyAverage: string },
  options: ExportOptions
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue 600
  const darkTextColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const grayTextColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // Encabezado
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('DUO', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(...grayTextColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Control Financiero Compartido', 33, 20);

  doc.setFontSize(14);
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Estado de Cuenta y Reporte Financiero', 14, 30);

  // Metadatos
  const todayStr = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFontSize(9);
  doc.setTextColor(...grayTextColor);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de emisión: ${todayStr}`, 14, 36);
  doc.text(`Espacio de Pareja: ${options.currentUserName} & ${options.partnerName}`, 14, 41);

  // Tarjeta de Resumen Financiero
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 46, 182, 24, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(...grayTextColor);
  doc.text('Gasto Total Acumulado', 20, 53);
  doc.text(`Aporte ${options.currentUserName}`, 70, 53);
  doc.text(`Aporte ${options.partnerName}`, 120, 53);
  doc.text('Promedio Diario', 160, 53);

  doc.setFontSize(12);
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${summary.totalSpent.toFixed(2)}`, 20, 62);
  doc.text(`$${summary.userTotal.toFixed(2)}`, 70, 62);
  doc.text(`$${summary.partnerTotal.toFixed(2)}`, 120, 62);
  doc.text(`$${summary.dailyAverage}`, 160, 62);

  // Tabla 1: Desglose por Categoría
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribución por Categorías', 14, 78);

  const categoryRows = categoryStats.map((c) => [
    c.categoryName,
    `${c.count}`,
    `$${c.total.toFixed(2)} USD`,
    `${c.percentage}%`,
  ]);

  autoTable(doc, {
    startY: 82,
    head: [['Categoría', 'N° Movimientos', 'Total Gastado', 'Porcentaje']],
    body: categoryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Tabla 2: Listado de Movimientos
  const currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Movimientos', 14, currentY);

  const txRows = transactions.map((tx) => {
    const isUser = tx.paidByUserId === options.currentUserId;
    const payerName = isUser ? options.currentUserName : options.partnerName;
    const catName = getCategoryName(tx.categoryId);
    const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('es-ES') : 'N/A';
    const splitStr = `${tx.splitRatio?.userA ?? 50}/${tx.splitRatio?.userB ?? 50}`;

    return [dateStr, tx.title, catName, payerName, splitStr, `$${tx.amount.toFixed(2)}`];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Fecha', 'Concepto', 'Categoría', 'Pagó', 'División', 'Monto']],
    body: txRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    margin: { left: 14, right: 14 },
  });

  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayTextColor);
    doc.text(
      `DUO Finanzas Compartidas • Página ${i} de ${pageCount}`,
      105,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    );
  }

  doc.save(`DUO_Reporte_${new Date().toISOString().substring(0, 10)}.pdf`);
}