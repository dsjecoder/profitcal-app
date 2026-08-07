import { OrderItem } from '../types';

export const TAX_RATE_ECOMMERCE = 0.015; // 1.5% Vietnam E-commerce tax policy

/**
 * Calculate Tax 1.5% for an order based on gross revenue
 */
export function calculateTax15Amount(grossRevenue: number): number {
  if (!grossRevenue || grossRevenue <= 0) return 0;
  return Math.round(grossRevenue * TAX_RATE_ECOMMERCE);
}

/**
 * Recalculate Net Profit including 1.5% Tax deduction
 */
export function calculateOrderNetProfit(
  netSettlement: number,
  cogs: number,
  packagingCost: number,
  taxAmount: number,
  includeTax: boolean = true
): number {
  const taxDeduction = includeTax ? taxAmount : 0;
  return netSettlement - cogs - packagingCost - taxDeduction;
}

/**
 * Audit all orders with Tax 1.5% deduction
 */
export function applyTaxAndProfitAudit(
  orders: OrderItem[],
  packagingCost: number,
  includeTax: boolean = true
): OrderItem[] {
  return orders.map((order) => {
    const taxAmount = calculateTax15Amount(order.grossRevenue);
    const netProfit = calculateOrderNetProfit(
      order.netSettlement,
      order.cogs,
      packagingCost,
      taxAmount,
      includeTax
    );

    return {
      ...order,
      packagingCost,
      taxAmount,
      netProfit,
      isNegativeProfit: netProfit < 0,
    };
  });
}
