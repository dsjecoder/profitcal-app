import * as XLSX from 'xlsx';
import { DisputeClaimItem, OrderItem } from '../types';
import { formatVND } from './storage';

/**
 * Filter loss orders and build Dispute Claim list
 */
export function extractDisputeClaims(orders: OrderItem[]): DisputeClaimItem[] {
  const lossOrders = orders.filter(
    (o) => o.isRefundAnomaly || o.isNegativeProfit || o.netSettlement < 0
  );

  return lossOrders.map((o) => {
    let lossAmount = 0;
    let reason = 'Đơn hàng bị thất thoát / trừ phí bất thường';
    let recommendedAction = 'Gửi mã đơn cho CSKH sàn yêu cầu tra soát lại số tiền thực nhận ví.';

    if (o.netSettlement < 0) {
      lossAmount = Math.abs(o.netSettlement) + o.cogs;
      reason = `Đơn hàng hoàn/hủy bị sàn trừ âm ví ví (-${Math.abs(o.netSettlement).toLocaleString('vi-VN')}đ) và mất giá vốn hàng`;
      recommendedAction = 'Yêu cầu CSKH sàn hoàn trả phí vận chuyển 2 chiều và bồi hoàn giá vốn hàng bị hỏng/mất.';
    } else if (o.feeRatio > 25) {
      lossAmount = Math.round(o.totalFees - o.grossRevenue * 0.15);
      reason = `Tỷ lệ phí sàn bị thu quá mức (${o.feeRatio.toFixed(1)}% so với mốc tiêu chuẩn 15%)`;
      recommendedAction = 'Yêu cầu kiểm tra lại phí dịch vụ Voucher Xtra / Freeship Xtra bị tính lặp.';
    } else if (o.netProfit < 0) {
      lossAmount = Math.abs(o.netProfit);
      reason = `Đơn hàng bị lỗ (-${Math.abs(o.netProfit).toLocaleString('vi-VN')}đ) do chi phí sàn + thuế cao hơn giá bán`;
      recommendedAction = 'Kháng nại điều chỉnh giá niêm yết hoặc cắt giảm gói voucher dịch vụ.';
    }

    return {
      orderId: o.orderId,
      orderDate: o.orderDate,
      sku: o.sku,
      productName: o.productName,
      lossAmount,
      reason,
      recommendedAction,
    };
  });
}

/**
 * Generate Excel Dispute File for Shopee / TikTok Shop CSKH Claim Support
 */
export function exportDisputeExcelFile(orders: OrderItem[]): void {
  const claims = extractDisputeClaims(orders);
  if (claims.length === 0) {
    alert('Không tìm thấy đơn hàng thất thoát nào để lập hồ sơ kháng nại!');
    return;
  }

  const exportRows = claims.map((c, idx) => ({
    'STT': idx + 1,
    'Mã Đơn Hàng': c.orderId,
    'Ngày Phát Sinh': c.orderDate,
    'Mã SKU Sản Phẩm': c.sku,
    'Tên Sản Phẩm': c.productName,
    'Số Tiền Thiệt HạI (VNĐ)': c.lossAmount,
    'Lý Do Kháng Nại Gửi Sàn': c.reason,
    'Hướng Dẫn Kháng Nại CSKH': c.recommendedAction,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 30 },
    { wch: 22 },
    { wch: 45 },
    { wch: 45 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ho_So_Khang_Nai_San');

  const filename = `Ho_So_Khang_Nai_Boi_Hoan_San_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
