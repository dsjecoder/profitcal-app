import * as XLSX from 'xlsx';
import { OrderItem, PlatformType } from '../types';
import { getSavedCOGS } from './storage';

export type DetectionConfidence = 'HIGH_CONFIDENCE' | 'UNCERTAIN' | 'UNSUPPORTED';

export interface ParseFileResult {
  orders: OrderItem[];
  detectedPlatform: PlatformType;
  confidence: DetectionConfidence;
  isPlatformMismatch: boolean;
  message?: string;
  totalRawRows?: number;
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
        if (!sheetName || !workbook.Sheets[sheetName]) {
          return resolve({
            orders: [],
            detectedPlatform: currentPlatform,
            confidence: 'UNSUPPORTED',
            isPlatformMismatch: false,
            message: 'File không có dữ liệu bảng tính hợp lệ!',
          });
        }

        const worksheet = workbook.Sheets[sheetName];
        
        // Convert worksheet to JSON array of objects
        let rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          return resolve({
            orders: [],
            detectedPlatform: currentPlatform,
            confidence: 'UNSUPPORTED',
            isPlatformMismatch: false,
            message: 'File rỗng hoặc không có dữ liệu hàng nào!',
          });
        }

        const totalRawRows = rawJson.length;

        // Limit to max 2,000 records for browser performance
        if (rawJson.length > 2000) {
          rawJson = rawJson.slice(0, 2000);
        }

        // Semantic confidence detection from headers
        const firstRowKeys = Object.keys(rawJson[0] || {});
        const allHeaders = firstRowKeys.join(' ').toLowerCase();

        // Check platform-specific keywords
        const hasTikTokSpecific = 
          allHeaders.includes('seller sku') ||
          allHeaders.includes('sku id') ||
          allHeaders.includes('tiktok') ||
          allHeaders.includes('retail delivery fee') ||
          allHeaders.includes('subtotal after discount') ||
          allHeaders.includes('platform_commission');

        const hasShopeeSpecific = 
          allHeaders.includes('mã đơn hàng') ||
          allHeaders.includes('shopee') ||
          allHeaders.includes('phí cố định') ||
          allHeaders.includes('phí dịch vụ') ||
          allHeaders.includes('freeship xtra') ||
          allHeaders.includes('voucher xtra') ||
          allHeaders.includes('tiền trợ giá');

        const hasGenericOrderHeaders =
          allHeaders.includes('sku') ||
          allHeaders.includes('order') ||
          allHeaders.includes('đơn') ||
          allHeaders.includes('doanh thu') ||
          allHeaders.includes('revenue') ||
          allHeaders.includes('giá') ||
          allHeaders.includes('thực nhận') ||
          allHeaders.includes('payout');

        let confidence: DetectionConfidence = 'UNSUPPORTED';
        let detectedPlatform: PlatformType = currentPlatform;

        if (hasShopeeSpecific && !hasTikTokSpecific) {
          confidence = 'HIGH_CONFIDENCE';
          detectedPlatform = 'shopee';
        } else if (hasTikTokSpecific && !hasShopeeSpecific) {
          confidence = 'HIGH_CONFIDENCE';
          detectedPlatform = 'tiktok';
        } else if (hasGenericOrderHeaders) {
          // File has general order headers but cannot distinguish between Shopee/TikTok with high certainty
          confidence = 'UNCERTAIN';
          detectedPlatform = currentPlatform;
        } else {
          // File does not look like an e-commerce order report at all
          confidence = 'UNSUPPORTED';
          return resolve({
            orders: [],
            detectedPlatform: currentPlatform,
            confidence: 'UNSUPPORTED',
            isPlatformMismatch: false,
            message: 'Cấu trúc file không khớp với định dạng báo cáo đơn hàng Shopee hoặc TikTok Shop.',
            totalRawRows,
          });
        }

        const isPlatformMismatch = detectedPlatform !== currentPlatform;
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
            getValue(['Mã đơn hàng', 'Order ID', 'Order No', 'Mã Đơn', 'Mã đơn']) || `ORD-${index + 1000}`
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

          const quantity = Math.max(1, parseNum(getValue(['Số lượng', 'Quantity', 'Qty'])) || 1);

          // Revenue & Payout
          let grossRevenue = Math.abs(
            parseNum(getValue(['Tổng doanh thu', 'Gross Revenue', 'Người mua thanh toán', 'Tổng giá trị', 'Doanh thu gộp']))
          );

          let netSettlement = parseNum(
            getValue(['Thực nhận', 'Net Settlement', 'Số tiền chuyển vào Ví', 'Net Payout', 'Doanh thu ròng', 'Tiền vào ví'])
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

          // Lookup COGS from local storage or default to 45% of gross price
          const cogsPerUnit = savedCOGS[sku] !== undefined ? savedCOGS[sku] : Math.round((grossRevenue / quantity) * 0.45);
          const cogs = cogsPerUnit * quantity;

          const taxAmount = Math.round(grossRevenue * 0.015);
          const feeRatio = grossRevenue > 0 ? (totalFees / grossRevenue) * 100 : 0;
          const netProfit = netSettlement - cogs - packagingCost - taxAmount;

          const isHighFee = feeRatio > feeThreshold;
          const isRefundAnomaly = (orderStatus === 'returned' || orderStatus === 'cancelled') && netSettlement < 0;

          // Optional shipping fields for Excel Transformer
          const trackingNumber = String(getValue(['Mã vận đơn', 'Tracking Number', 'Tracking No', 'Mã tracking']) || '');
          const carrierName = String(getValue(['Đơn vị vận chuyển', 'Carrier', 'Shipping Provider', 'Đơn vị VC']) || 'SPX');

          parsedOrders.push({
            id: `ord_${index + 1}_${Date.now()}`,
            orderId,
            orderDate,
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
            feeRatio,
            taxAmount,
            cogs,
            netProfit,
            orderStatus,
            isNegativeProfit: netProfit < 0,
            isHighFee,
            isRefundAnomaly,
            trackingNumber,
            carrierName,
          });
        });

        resolve({
          orders: parsedOrders,
          detectedPlatform,
          confidence,
          isPlatformMismatch,
          totalRawRows,
        });
      } catch (err: any) {
        resolve({
          orders: [],
          detectedPlatform: currentPlatform,
          confidence: 'UNSUPPORTED',
          isPlatformMismatch: false,
          message: err.message || 'Lỗi xử lý file Excel!',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        orders: [],
        detectedPlatform: currentPlatform,
        confidence: 'UNSUPPORTED',
        isPlatformMismatch: false,
        message: 'Không thể đọc nội dung file!',
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
