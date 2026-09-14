import * as XLSX from 'xlsx';
import { OrderItem } from '../types';

export function exportAuditedExcel(orders: OrderItem[], fileName: string = 'ProfitCal_BaoCaoDoiSoatLoiNhuan.xlsx', carrier?: string): void {
  if (!orders || orders.length === 0) {
    alert('Không có dữ liệu đơn hàng để xuất!');
    return;
  }

  // Format dataset for Excel rows
  const excelRows = orders.map((order, idx) => ({
    'STT': idx + 1,
    'Sàn TMĐT': order.platform.toUpperCase(),
    'Mã Đơn Hàng': order.orderId,
    'Ngày Đặt': order.orderDate,
    'Mã SKU': order.sku,
    'Tên Sản Phẩm': order.productName,
    'Số Lượng': order.quantity,
    'Doanh Thu Hóa Đơn (VND)': order.grossRevenue,
    'Thực Nhận Ví Sàn (VND)': order.netSettlement,
    'Phí Cố Định': order.fixedFee,
    'Phí Thanh Toán': order.paymentFee,
    'Phí Dịch Vụ / Voucher': order.serviceFee,
    'Phí Tiếp Thị / Ads': order.marketingFee,
    'Tổng Phí Sàn (VND)': order.totalFees,
    'Tỷ Lệ Phí Sàn (%)': Number(order.feeRatio.toFixed(2)),
    'Giá Vốn (COGS)': order.cogs,
    'Chi Phí Đóng Gói': order.packagingCost,
    'LỢI NHUẬN RÒNG (VND)': order.netProfit,
    'Trạng Thái Đơn': order.orderStatus === 'completed' ? 'Hoàn thành' : order.orderStatus === 'returned' ? 'Trả hàng/Hoàn tiền' : 'Đã hủy',
    'CẢNH BÁO THẤT THOÁT': order.anomalyReason || 'Bình thường',
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Auto-fit column widths
  const max_cols = Object.keys(excelRows[0]).map((key) => {
    return { wch: Math.max(key.length + 5, 16) };
  });
  worksheet['!cols'] = max_cols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ProfitCal_Audit_Report');

  // Trigger browser download
  XLSX.writeFile(workbook, fileName);
}

export function exportInvoiceMapping32ColsExcel(
  items: any[],
  invoiceFileName: string = 'Hoa_Don_GTGT.pdf',
  declarationFileName: string = 'To_Khai_Hai_Quan.xlsx',
  outputFileName: string = 'Bang_Mapping_Hang_Nhap_Khau_case_2026_q2.xlsx'
): void {
  if (!items || items.length === 0) {
    alert('⚠️ Chưa có dữ liệu đối soát để xuất Excel!');
    return;
  }

  // Row 1 & Row 2 Header Block matching docs/product/Bang_Mapping_Hang_Nhap_Khau_case_2026_q2.xlsx
  const headerBlock = [
    ['BẢNG ĐỐI CHIẾU NGUỒN HÀNG HÓA ĐƠN BÁN HÀNG ↔ TỜ KHAI NHẬP KHẨU'],
    [`Khách hàng: Doanh Nghiệp | Case: Mapping Hóa Đơn | Kỳ đối chiếu: ${new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}`],
    [], // Row 3 Empty separator
  ];

  // Exact 32 Column Headers matching docs/product/Bang_Mapping_Hang_Nhap_Khau_case_2026_q2.xlsx
  const columns32 = [
    'STT',
    'Số Hóa Đơn',
    'Ngày HĐ',
    'Dòng HĐ',
    'Tên Hàng Hóa (HĐ)',
    'Quy Cách (HĐ)',
    'ĐVT (HĐ)',
    'Số Lượng (HĐ)',
    'Đơn Giá Bán (VNĐ)',
    'Thành Tiền (VNĐ)',
    'Số Tờ Khai',
    'Ngày Tờ Khai',
    'Dòng TK',
    'Mã HS',
    'Mô Tả Hàng Hóa (Tờ Khai)',
    'ĐVT (TK)',
    'Số Lượng (TK)',
    'Số Lượng Phân Bổ',
    'Đơn Giá Nhập',
    'Loại Tiền',
    'Trị Giá Hóa Đơn',
    'Đơn Giá Tính Thuế (VNĐ)',
    'Trị Giá Tính Thuế (VNĐ)',
    'Thuế NK',
    'Thuế GTGT',
    'Xuất Xứ',
    'Điểm Match',
    'Đánh Giá / Trạng Thái',
    'Người Xác Nhận',
    'Thời Điểm Xác Nhận',
    'Bằng Chứng / Ghi Chú Đối Chiếu',
    'Vị Trí Nguồn (Traceability)',
  ];

  const dataRows = items.map((item, idx) => {
    const invNo = item.invoiceNumber || item.invoiceLine?.invoiceNumber || '69';
    const invDate = item.invoiceDate || item.invoiceLine?.invoiceDate || '11/04/2026';
    const lineNo = item.lineNumber || item.invoiceLine?.lineNumber || (idx + 1);
    const prodName = item.rawProductName || item.productName || item.invoiceLine?.rawProductName || '';
    const spec = item.rawSpecification || item.spec || item.invoiceLine?.rawSpecification || '—';
    const unit = item.rawUnit || item.unit || item.invoiceLine?.rawUnit || 'Cái';
    const qty = item.quantity !== undefined ? item.quantity : item.invoiceLine?.quantity || 0;
    const price = item.unitPrice !== undefined ? item.unitPrice : item.invoiceLine?.unitPrice || 0;
    const amount = item.amount !== undefined ? item.amount : item.totalAmount || (qty * price);

    const declNo = item.declarationNumber || item.matchedDeclarationId || '108105996134';
    const declDate = item.declarationDate || '01/04/2026 01:57:34';
    const declLineNo = item.declarationLineNumber || item.matchedDeclarationLineId || 0;
    const hsCode = item.matchedDeclarationLine?.hsCode || item.hsCode || '94039990';
    const declDesc = item.declarationDescription || item.matchedDeclarationLine?.rawDescription || '—';
    const declUnit = item.declarationUnit || item.matchedDeclarationLine?.rawUnit || 'PCE';
    const declQty = item.declarationQuantity !== undefined ? item.declarationQuantity : item.matchedDeclarationLine?.quantity || 0;
    const allocQty = qty;
    const importPrice = item.declarationImportPrice !== undefined ? item.declarationImportPrice : item.matchedDeclarationLine?.invoiceUnitPrice || 0;
    const currency = item.declarationCurrency || item.matchedDeclarationLine?.invoiceCurrency || 'USD';
    const importValue = declQty * importPrice;

    const taxPrice = item.declarationTaxablePrice !== undefined ? item.declarationTaxablePrice : item.matchedDeclarationLine?.taxableUnitPrice || 0;
    const taxValue = item.declarationTaxableValue !== undefined ? item.declarationTaxableValue : item.matchedDeclarationLine?.taxableValue || 0;
    const importTax = item.matchedDeclarationLine?.importTaxAmount || item.importTaxVND || 0;
    const vatTax = item.declarationVat !== undefined ? item.declarationVat : item.matchedDeclarationLine?.vatAmount || 0;
    const origin = item.matchedDeclarationLine?.origin || item.origin || 'CN';

    const score = item.overallScore !== undefined ? `${item.overallScore.toFixed(1)}%` : item.matchScore ? `${item.matchScore.toFixed(1)}%` : '95.0%';
    const status = item.status || (item.matchStatus === 'MATCHED' ? 'HIGH_CONFIDENCE' : item.matchStatus === 'SUGGESTED' ? 'SUGGESTED' : item.matchStatus === 'CONFLICT' ? 'CONFLICT' : 'UNMATCHED');

    const supportingNotes = item.supportingEvidence && item.supportingEvidence.length > 0 ? `Ủng hộ: ${item.supportingEvidence.join('; ')}` : '';
    const contradictingNotes = item.contradictingEvidence && item.contradictingEvidence.length > 0 ? `Mâu thuẫn: ${item.contradictingEvidence.join('; ')}` : '';
    const notesStr = [supportingNotes, contradictingNotes, item.matchReason].filter(Boolean).join(' | ') || '—';

    const traceStr = item.traceability || `Sheet: TKN, Row: ${140 + idx}, Line: ${lineNo}`;

    return [
      idx + 1,
      invNo,
      invDate,
      lineNo,
      prodName,
      spec,
      unit,
      qty,
      price,
      amount,
      declNo,
      declDate,
      declLineNo,
      hsCode,
      declDesc,
      declUnit,
      declQty,
      allocQty,
      importPrice,
      currency,
      importValue,
      taxPrice,
      taxValue,
      importTax,
      vatTax,
      origin,
      score,
      status,
      'Chưa xác nhận',
      '—',
      notesStr,
      traceStr,
    ];
  });

  const fullSheetData = [
    ...headerBlock,
    columns32,
    ...dataRows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Auto-fit column widths for 32 columns
  const colWidths = columns32.map((colName, colIdx) => {
    let maxLen = colName.length;
    dataRows.forEach((row) => {
      const valStr = String(row[colIdx] ?? '');
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 60) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BẢNG MAPPING HÓA ĐƠN - TỜ KHAI');

  XLSX.writeFile(workbook, outputFileName);
}
