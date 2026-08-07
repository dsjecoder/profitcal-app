import * as XLSX from 'xlsx';
import { CarrierType, OrderItem, UserState } from '../types';

const SHIPPING_COOLDOWN_KEY = 'profitcal_last_shipping_export_timestamp';

// Helper to clean phone numbers: "+84 988 123 456" -> "0988123456"
export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '0900000000';
  let cleaned = String(phone).replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(2);
  } else if (!cleaned.startsWith('0') && cleaned.length >= 9) {
    cleaned = '0' + cleaned;
  }
  return cleaned || '0900000000';
}

// Helper to check 24-hour Free export cooldown
export function checkFreeShippingCooldown(): { canExport: boolean; remainingHours: number; remainingMins: number } {
  try {
    const raw = localStorage.getItem(SHIPPING_COOLDOWN_KEY);
    if (!raw) return { canExport: true, remainingHours: 0, remainingMins: 0 };

    const lastTime = new Date(raw).getTime();
    const now = new Date().getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const diff = TWENTY_FOUR_HOURS - (now - lastTime);

    if (diff <= 0) {
      return { canExport: true, remainingHours: 0, remainingMins: 0 };
    }

    const remainingHours = Math.floor(diff / (1000 * 60 * 60));
    const remainingMins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { canExport: false, remainingHours, remainingMins };
  } catch (e) {
    return { canExport: true, remainingHours: 0, remainingMins: 0 };
  }
}

export function recordFreeShippingExport(): void {
  try {
    localStorage.setItem(SHIPPING_COOLDOWN_KEY, new Date().toISOString());
  } catch (e) {}
}

/**
 * Generate Shipping Excel File for Carriers (GHTK, Viettel Post, GHN, SPX)
 */
export function exportCarrierExcel(
  orders: OrderItem[],
  carrier: CarrierType,
  user: UserState,
  onCooldownBlock?: (hours: number, mins: number) => void,
  onLimitExceeded?: (total: number) => void
): boolean {
  if (!orders || orders.length === 0) {
    alert('Không có dữ liệu đơn hàng để xuất!');
    return false;
  }

  // 1. Check Free Cooldown (24 hours = 1 day)
  if (user.tier === 'free') {
    const cooldown = checkFreeShippingCooldown();
    if (!cooldown.canExport) {
      if (onCooldownBlock) {
        onCooldownBlock(cooldown.remainingHours, cooldown.remainingMins);
      } else {
        alert(`Gói FREE quy định mỗi lượt xuất file vận chuyển cách nhau 1 ngày. Lượt tiếp theo của bạn sẽ mở sau: ${cooldown.remainingHours} giờ ${cooldown.remainingMins} phút. Nâng cấp PRO (130k/tháng) để xuất không giới hạn!`);
      }
      return false;
    }
  }

  // 2. Check Free Max Rows (100 orders per export)
  let exportList = orders;
  if (user.tier === 'free' && orders.length > 100) {
    if (onLimitExceeded) {
      onLimitExceeded(orders.length);
    }
    alert(`Gói FREE giới hạn xuất tối đa 100 đơn / lượt. Hệ thống đã tự động lấy 100 đơn đầu tiên. Nâng cấp PRO (130k/tháng) để xuất không giới hạn!`);
    exportList = orders.slice(0, 100);
  }

  let formattedRows: any[] = [];
  let sheetName = 'Dong_Don_Hang';
  let defaultFileName = `Don_Van_Chuyen_${carrier.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;

  switch (carrier) {
    case 'ghtk':
      sheetName = 'GHTK_Import';
      formattedRows = exportList.map((o, idx) => ({
        'STT': idx + 1,
        'Mã đơn hàng shop': o.orderId,
        'Tên người nhận': o.receiverName || `Khách hàng ${o.orderId.slice(-4)}`,
        'Số điện thoại': cleanPhoneNumber(o.receiverPhone),
        'Địa chỉ chi tiết': o.receiverAddress || 'Việt Nam',
        'Tỉnh/Thành phố': o.province || 'Hà Nội',
        'Quận/Huyện': o.district || 'Cầu Giấy',
        'Tiền thu hộ COD (VND)': o.netSettlement > 0 ? o.grossRevenue : 0,
        'Mã SKU sản phẩm': o.sku,
        'Tên sản phẩm': o.productName,
        'Số lượng': o.quantity,
        'Khối lượng (kg)': 0.5,
        'Ghi chú giao hàng': 'Cho xem hàng, không cho thử',
      }));
      break;

    case 'viettelpost':
      sheetName = 'ViettelPost_Import';
      formattedRows = exportList.map((o, idx) => ({
        'STT': idx + 1,
        'Mã đơn hàng': o.orderId,
        'Tên người nhận': o.receiverName || `Khách hàng ${o.orderId.slice(-4)}`,
        'Điện thoại nhận': cleanPhoneNumber(o.receiverPhone),
        'Địa chỉ nhận': o.receiverAddress || 'Việt Nam',
        'Tỉnh/Thành': o.province || 'Hà Nội',
        'Quận/Huyện': o.district || 'Cầu Giấy',
        'Tiền thu hộ COD': o.netSettlement > 0 ? o.grossRevenue : 0,
        'Tên hàng hóa': `${o.productName} (SKU: ${o.sku})`,
        'Số lượng': o.quantity,
        'Trọng lượng (gram)': 500,
        'Ghi chú': 'Cho xem hàng, không cho thử',
      }));
      break;

    case 'ghn':
      sheetName = 'GHN_Batch_Import';
      formattedRows = exportList.map((o, idx) => ({
        'STT': idx + 1,
        'Mã Đơn Hàng': o.orderId,
        'Tên Người Nhận': o.receiverName || `Khách hàng ${o.orderId.slice(-4)}`,
        'Số Điện Thoại': cleanPhoneNumber(o.receiverPhone),
        'Địa Chỉ Giao Hàng': o.receiverAddress || 'Việt Nam',
        'Tỉnh/Thành': o.province || 'Hồ Chí Minh',
        'Quận/Huyện': o.district || 'Quận 1',
        'Tiền COD': o.netSettlement > 0 ? o.grossRevenue : 0,
        'Mã SKU': o.sku,
        'Sản Phẩm': o.productName,
        'Số Lượng': o.quantity,
        'Ghi Chú': 'Cho xem hàng',
      }));
      break;

    case 'spx':
      sheetName = 'SPX_Bulk_Order';
      formattedRows = exportList.map((o, idx) => ({
        'No': idx + 1,
        'Order ID': o.orderId,
        'Recipient Name': o.receiverName || `Customer ${o.orderId.slice(-4)}`,
        'Recipient Phone': cleanPhoneNumber(o.receiverPhone),
        'Full Address': o.receiverAddress || 'Vietnam',
        'COD Amount': o.netSettlement > 0 ? o.grossRevenue : 0,
        'SKU': o.sku,
        'Product Title': o.productName,
        'Qty': o.quantity,
        'Remark': 'Allow Inspection',
      }));
      break;
  }

  // Create Excel workbook
  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  const max_cols = Object.keys(formattedRows[0]).map((key) => ({
    wch: Math.max(key.length + 4, 18),
  }));
  worksheet['!cols'] = max_cols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Trigger browser download
  XLSX.writeFile(workbook, defaultFileName);

  // Record 24h cooldown if Free user
  if (user.tier === 'free') {
    recordFreeShippingExport();
  }

  return true;
}
