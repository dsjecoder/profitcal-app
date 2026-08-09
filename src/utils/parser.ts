import * as XLSX from 'xlsx';
import { OrderItem, PlatformType } from '../types';
import { getSavedCOGS } from './storage';

export interface ParseFileResult {
  orders: OrderItem[];
  detectedPlatform: PlatformType;
  isPlatformMismatch: boolean;
  message?: string;
}

export async function parseUploadedFile(
  file: File,
  currentPlatform: PlatformType,
  packagingCost: number,
  feeThreshold: number
): Promise<ParseFileResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert worksheet to JSON array of objects
        let rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('File Excel rỗng hoặc không đúng định dạng!');
        }

        // Limit to max 2,000 records for browser safety & speed
        if (rawJson.length > 2000) {
          alert(`File của bạn có ${rawJson.length.toLocaleString('vi-VN')} dòng. Để bảo đảm tốc độ và hiệu năng tính toán tại Trình duyệt, hệ thống đã tự động giới hạn phân tích 2.000 dòng đầu tiên.`);
          rawJson = rawJson.slice(0, 2000);
        }

        // Auto-detect platform from Excel headers
        const allHeaders = Object.keys(rawJson[0] || {}).join(' ').toLowerCase();
        let detectedPlatform: PlatformType = currentPlatform;

        const hasTikTokKeywords = allHeaders.includes('tiktok') || allHeaders.includes('seller sku') || allHeaders.includes('sku id') || allHeaders.includes('subtotal') || allHeaders.includes('platform_commission');
        const hasShopeeKeywords = allHeaders.includes('shopee') || allHeaders.includes('mã đơn hàng') || allHeaders.includes('phí cố định') || allHeaders.includes('phí dịch vụ') || allHeaders.includes('freeship xtra');

        if (hasTikTokKeywords && !hasShopeeKeywords) {
          detectedPlatform = 'tiktok';
        } else if (hasShopeeKeywords) {
          detectedPlatform = 'shopee';
        }

        const isPlatformMismatch = detectedPlatform !== currentPlatform;
        const targetPlatform = detectedPlatform;

        const savedCOGS = getSavedCOGS();
        const parsedOrders: OrderItem[] = [];

        rawJson.forEach((row, index) => {
          // Flexible key lookup helper
          const getValue = (possibleKeys: string[]): any => {
            for (const key of possibleKeys) {
              const matchedKey = Object.keys(row).find((k) =>
                k.toLowerCase().trim().includes(key.toLowerCase().trim())
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return row[matchedKey];
              }
            }
            return null;
          };

          const parseNum = (val: any): number => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            const str = String(val).replace(/[^0-9.-]+/g, '');
            const parsed = parseFloat(str);
            return isNaN(parsed) ? 0 : parsed;
          };

          // Extract basic fields
          const orderId = String(
            getValue(['Mã đơn hàng', 'Order ID', 'Order No', 'Mã Đơn']) || `ORD-${index + 1000}`
          );

          const orderDate = String(
            getValue(['Ngày', 'Date', 'Time', 'Thời gian']) || new Date().toISOString().split('T')[0]
          );

          const sku = String(
            getValue(['SKU', 'Mã SKU', 'Seller SKU', 'Mã sản phẩm']) || 'UNKNOWN-SKU'
          );

          const productName = String(
            getValue(['Tên sản phẩm', 'Product Name', 'Sản phẩm', 'Title']) || 'Sản phẩm ' + sku
          );

          const quantity = parseNum(getValue(['Số lượng', 'Quantity', 'Qty'])) || 1;

          // Revenue & Payout
          let grossRevenue = Math.abs(
            parseNum(getValue(['Tổng doanh thu', 'Gross Revenue', 'Người mua thanh toán', 'Tổng giá trị', 'Doanh thu gộp']))
          );

          let netSettlement = parseNum(
            getValue(['Thực nhận', 'Net Settlement', 'Số tiền chuyển vào Ví', 'Net Payout', 'Doanh thu ròng'])
          );

          // Fees breakdown
          const fixedFee = Math.abs(parseNum(getValue(['Phí cố định', 'Fixed Fee', 'Hoa hồng sàn', 'Commission'])));
          const paymentFee = Math.abs(parseNum(getValue(['Phí thanh toán', 'Payment Fee', 'Phí giao dịch', 'Transaction Fee'])));
          const serviceFee = Math.abs(parseNum(getValue(['Phí dịch vụ', 'Service Fee', 'Freeship Xtra', 'Voucher Xtra'])));
          const marketingFee = Math.abs(parseNum(getValue(['Phí tiếp thị', 'Marketing Fee', 'Affiliate', 'KOC', 'Quảng cáo'])));
          const otherFee = Math.abs(parseNum(getValue(['Phí khác', 'Other Fee', 'Phí vận chuyển trừ'])));

          let totalFees = fixedFee + paymentFee + serviceFee + marketingFee + otherFee;
          
          if (totalFees === 0 && grossRevenue > 0 && netSettlement > 0) {
            totalFees = Math.max(0, grossRevenue - netSettlement);
          }

          if (grossRevenue === 0 && netSettlement > 0) {
            grossRevenue = netSettlement + totalFees;
          }

          // Order status
          const rawStatus = String(
            getValue(['Trạng thái', 'Status', 'Tình trạng']) || 'Hoàn thành'
          ).toLowerCase();

          let orderStatus: OrderItem['orderStatus'] = 'completed';
          if (rawStatus.includes('trả') || rawStatus.includes('hoàn') || rawStatus.includes('refund')) {
            orderStatus = 'returned';
          } else if (rawStatus.includes('hủy') || rawStatus.includes('cancel')) {
            orderStatus = 'cancelled';
          }

          // Lookup COGS from local storage or default to 50% of gross price
          const cogsPerUnit = savedCOGS[sku] !== undefined ? savedCOGS[sku] : Math.round((grossRevenue / Math.max(1, quantity)) * 0.5);
          const cogs = cogsPerUnit * quantity;

          const taxAmount = Math.round(grossRevenue * 0.015);
          const feeRatio = grossRevenue > 0 ? (totalFees / grossRevenue) * 100 : 0;
          const netProfit = netSettlement - cogs - packagingCost - taxAmount;

          const isHighFee = feeRatio > feeThreshold;
          const isRefundAnomaly = (orderStatus === 'returned' || orderStatus === 'cancelled') && netSettlement < 0;
          const isNegativeProfit = netProfit < 0;

          let anomalyReason = '';
          if (isHighFee) anomalyReason += `Tỷ lệ phí sàn ${feeRatio.toFixed(1)}% vượt mốc ${feeThreshold}%. `;
          if (isRefundAnomaly) anomalyReason += `Đơn hoàn/hủy bị trừ tiền sai ví (${netSettlement}đ). `;
          if (isNegativeProfit) anomalyReason += `Đơn bị lỗ (-${Math.abs(netProfit)}đ). `;

          parsedOrders.push({
            id: `${targetPlatform.toUpperCase()}-${index + 1}`,
            orderId,
            orderDate,
            platform: targetPlatform,
            sku,
            productName,
            quantity,
            grossRevenue,
            netSettlement,
            fixedFee,
            paymentFee,
            serviceFee,
            marketingFee,
            otherFee,
            totalFees,
            cogs,
            packagingCost,
            taxAmount,
            orderStatus,
            feeRatio,
            netProfit,
            isHighFee,
            isRefundAnomaly,
            isNegativeProfit,
            anomalyReason: anomalyReason.trim() || undefined,
            carrierName: String(getValue(['Đơn vị vận chuyển', 'Carrier', 'Shipping Provider']) || 'SPX Express'),
            trackingNumber: String(getValue(['Mã vận đơn', 'Tracking Number', 'Waybill']) || `SPX${Date.now()}`),
          });
        });

        resolve({
          orders: parsedOrders,
          detectedPlatform,
          isPlatformMismatch,
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Lỗi đọc file Excel từ hệ thống!'));
    };

    reader.readAsArrayBuffer(file);
  });
}
