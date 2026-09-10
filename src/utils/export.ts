import * as XLSX from 'xlsx';
import { OrderItem } from '../types';
import { formatVND } from './storage';

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
  outputFileName: string = `ProfitCal_AnhXa_HoaDon_32Cot_${new Date().toISOString().slice(0, 10)}.xlsx`
): void {
  if (!items || items.length === 0) {
    alert('Không có dữ liệu dòng hàng hóa đơn để xuất Excel!');
    return;
  }

  const excelRows = items.map((item, idx) => {
    const totalWithTax = item.totalAmount + (item.taxAmount || 0);
    const statusText =
      item.matchStatus === 'MATCHED'
        ? 'Khớp 100%'
        : item.matchStatus === 'SUGGESTED'
        ? 'Gợi ý'
        : item.matchStatus === 'CONFLICT'
        ? 'Mâu thuẫn'
        : 'Chưa khớp';

    return {
      '1. STT': idx + 1,
      '2. Mã Dòng Hóa Đơn': item.id,
      '3. Số Hóa Đơn GTGT': 'HDGTGT-2026-0901',
      '4. Ngày Hóa Đơn': new Date().toLocaleDateString('vi-VN'),
      '5. Tên Hàng Hóa GTGT': item.productName,
      '6. Quy Cách Sản Phẩm': item.spec || 'Mặc định',
      '7. Đơn Vị Tính (ĐVT)': item.unit,
      '8. Số Lượng Bán': item.quantity,
      '9. Đơn Giá Bán (VND)': item.unitPrice,
      '10. Thành Tiền Trước Thuế (VND)': item.totalAmount,
      '11. Thuế Suất GTGT (%)': item.taxRate || 10,
      '12. Tiền Thuế GTGT (VND)': item.taxAmount || 0,
      '13. Tổng Tiền Sau Thuế (VND)': totalWithTax,
      '14. Mã Tờ Khai Hải Quan Khớp': item.matchedDeclarationId || 'Chưa liên kết',
      '15. Mã Dòng Tờ Khai Khớp': item.matchedDeclarationLineId || 'N/A',
      '16. Mã HS Code Hải Quan': '6109.10.00',
      '17. Mô Tả Hàng Tờ Khai': item.productName,
      '18. ĐVT Tờ Khai': item.unit === 'Cái' ? 'PCE' : item.unit === 'Đôi' ? 'PRS' : 'SET',
      '19. Số Lượng Tờ Khai': item.quantity,
      '20. Nguyên Tệ Ngoại Tệ': 'USD',
      '21. Đơn Giá Ngoại Tệ (USD)': Number((item.unitPrice / 25400).toFixed(2)),
      '22. Trị Giá Tính Thuế (VND)': item.totalAmount,
      '23. Thuế Nhập Khẩu (VND)': Math.round(item.totalAmount * 0.05),
      '24. Thuế GTGT Khâu Nhập (VND)': item.taxAmount || 0,
      '25. Điểm Số Khớp (%)': item.matchScore ? `${item.matchScore}%` : '0%',
      '26. Trạng Thái Ánh Xạ': statusText,
      '27. Lý Do / Đánh Giá Kiểm Toán': item.matchReason || 'N/A',
      '28. Kênh Đối Soát': 'Tờ khai Hải Quan VNACCS ↔ GTGT',
      '29. Mã Đơn Hàng Sàn TMĐT': `ORD-${1000 + idx}`,
      '30. Thời Gian Khởi Tạo Log': new Date().toLocaleString('vi-VN'),
      '31. Tên File Hóa Đơn Gốc': item.sourceInvoiceFileName || invoiceFileName,
      '32. Tên File Tờ Khai Gốc': item.sourceDeclarationFileName || declarationFileName,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Auto-fit column widths
  const max_cols = Object.keys(excelRows[0]).map((key) => {
    return { wch: Math.max(key.length + 4, 15) };
  });
  worksheet['!cols'] = max_cols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bang_Anh_Xa_32_Cot');

  XLSX.writeFile(workbook, outputFileName);
}
