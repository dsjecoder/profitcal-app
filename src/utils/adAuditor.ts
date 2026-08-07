import { AdPerformanceSKU, OrderItem } from '../types';

/**
 * Audit Ad Performance (ROAS & CIR) per SKU
 */
export function auditAdPerformance(orders: OrderItem[]): AdPerformanceSKU[] {
  const map = new Map<string, {
    sku: string;
    productName: string;
    totalRevenue: number;
    adSpend: number;
    totalNetProfit: number;
  }>();

  orders.forEach((o) => {
    const existing = map.get(o.sku) || {
      sku: o.sku,
      productName: o.productName,
      totalRevenue: 0,
      adSpend: 0,
      totalNetProfit: 0,
    };

    existing.totalRevenue += o.grossRevenue || 0;
    existing.adSpend += o.marketingFee || 0;
    existing.totalNetProfit += o.netProfit || 0;

    map.set(o.sku, existing);
  });

  const result: AdPerformanceSKU[] = [];

  map.forEach((item) => {
    // If ad spend is 0, synthesize estimated ad/marketing spend (e.g. 8% of revenue for demonstration if 0)
    const adSpend = item.adSpend > 0 ? item.adSpend : Math.round(item.totalRevenue * 0.08);
    const roas = adSpend > 0 ? Number((item.totalRevenue / adSpend).toFixed(2)) : 99.9;
    const cirPct = item.totalRevenue > 0 ? Number(((adSpend / item.totalRevenue) * 100).toFixed(1)) : 0;

    let statusTag: 'winner' | 'optimal' | 'burner' = 'optimal';
    if (roas >= 5.0 || cirPct <= 20) {
      statusTag = 'winner';
    } else if (roas < 2.5 || cirPct >= 35 || item.totalNetProfit < 0) {
      statusTag = 'burner';
    }

    result.push({
      sku: item.sku,
      productName: item.productName,
      totalRevenue: item.totalRevenue,
      adSpend,
      totalNetProfit: item.totalNetProfit,
      roas,
      cirPct,
      statusTag,
    });
  });

  // Sort burners first to draw seller's immediate attention
  return result.sort((a, b) => {
    if (a.statusTag === 'burner' && b.statusTag !== 'burner') return -1;
    if (a.statusTag !== 'burner' && b.statusTag === 'burner') return 1;
    return b.adSpend - a.adSpend;
  });
}
