import { SKUData, StockAlert } from '../types';

const TELEGRAM_CONFIG_KEY = 'profitcal_telegram_config_v1';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export function getTelegramConfig(): TelegramConfig {
  try {
    const raw = localStorage.getItem(TELEGRAM_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { botToken: '', chatId: '', enabled: false };
  } catch (e) {
    return { botToken: '', chatId: '', enabled: false };
  }
}

export function saveTelegramConfig(config: TelegramConfig): void {
  try {
    localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {}
}

/**
 * Web Audio API Audio Alarm (Beep Beep / Tít Tít sound)
 */
export function playLowStockBeepSound(): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const playBeep = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Play double beep sound: "Tít... Tít!"
    playBeep(880, 0, 0.15);     // Beep 1
    playBeep(1100, 0.2, 0.25);   // Beep 2
  } catch (e) {
    console.error('Error playing audio alert sound', e);
  }
}

/**
 * Evaluate SKU stock levels and detect low stock anomalies (< safetyThreshold)
 */
export function auditLowStockSKUs(skus: SKUData[]): StockAlert[] {
  if (!skus || skus.length === 0) {
    return [
      { sku: 'AO-THUN-POLO-NEO-M', productName: 'Áo Nam Polo Cotton Co Giãn 4 Chiều (M)', stockCount: 1, safetyThreshold: 5, isLowStock: true },
      { sku: 'VAY-SUONG-HOA-VINTAGE-L', productName: 'Váy Đầm Suông Họa Tiết Vintage (L)', stockCount: 0, safetyThreshold: 3, isLowStock: true },
      { sku: 'GIAY-SNEAKER-TRANG-42', productName: 'Giày Sneaker Nam Cổ Thấp Trắng (Size 42)', stockCount: 2, safetyThreshold: 5, isLowStock: true },
      { sku: 'SON-KEM-LY-MATTE-01', productName: 'Son Kem Lì Giữ Màu 24h (Màu Đỏ Cam)', stockCount: 12, safetyThreshold: 5, isLowStock: false },
    ];
  }

  const alerts: StockAlert[] = [];

  skus.forEach((item) => {
    const threshold = item.safetyThreshold || 3;
    const isLowStock = item.stockCount < threshold;

    alerts.push({
      sku: item.sku,
      productName: item.productName,
      stockCount: item.stockCount,
      safetyThreshold: threshold,
      isLowStock,
    });
  });

  return alerts;
}

/**
 * Dispatch Telegram Webhook Notification for Low Stock SKUs
 */
export async function sendTelegramLowStockAlert(
  alerts: StockAlert[],
  config: TelegramConfig
): Promise<boolean> {
  if (!config.enabled || !config.botToken || !config.chatId) return false;

  const lowStockItems = alerts.filter((a) => a.isLowStock);
  if (lowStockItems.length === 0) return false;

  const messageLines = [
    `🚨 *PROFITCAL WARNING: CẢNH BÁO TỒN KHO CẠN (RED ALERT)* 🚨`,
    `⏰ *Thời gian:* ${new Date().toLocaleString('vi-VN')}`,
    `📦 *Số mã SKU rớt dưới ngưỡng an toàn:* ${lowStockItems.length} mã SKU\n`,
    `----------------------------------------`,
  ];

  lowStockItems.forEach((item) => {
    messageLines.push(
      `⚠️ *SKU:* \`${item.sku}\`\n👉 *Sản phẩm:* ${item.productName}\n📉 *Tồn kho hiện tại:* *${item.stockCount} cái* (Ngưỡng an toàn: < ${item.safetyThreshold})\n`
    );
  });

  messageLines.push(`💡 *Khuyến nghị:* Hãy nhanh chóng cập nhật hạ tồn kho trên Shopee/TikTok Shop để tránh bị hủy đơn phạt Sao Quả Tạ!`);

  const endpoint = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: messageLines.join('\n'),
        parse_mode: 'Markdown',
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to dispatch Telegram Webhook alert', err);
    return false;
  }
}
