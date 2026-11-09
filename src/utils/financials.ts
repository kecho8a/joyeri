import { Employee, Expense, Product, Sale, SaleReturn } from '../types';

export type FinancialTimeFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';

export function matchesTimeFilter(dateString: string, filter: FinancialTimeFilter): boolean {
  if (filter === 'ALL') return true;

  const date = new Date(dateString);
  const now = new Date();

  if (filter === 'TODAY') {
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  if (filter === 'WEEK') {
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }

  if (filter === 'MONTH') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  return date.getFullYear() === now.getFullYear();
}

export interface ProfitAndLossInput {
  sales: Sale[];
  returns: SaleReturn[];
  products: Product[];
  employees: Employee[];
  expenses: Expense[];
}

export interface ProfitAndLoss {
  grossSalesCOP: number;
  discountsCOP: number;
  returnsCOP: number;
  returnsVatCOP: number;
  netRevenueCOP: number;
  vatCOP: number;
  cogsCOP: number;
  grossProfitCOP: number;
  grossMarginPercent: number;
  commissionsCOP: number;
  expensesCOP: number;
  netOperatingIncomeCOP: number;
  missingCostItems: number;
}

export interface SellerPerformance {
  name: string;
  salesCount: number;
  totalSalesCOP: number;
  itemsCount: number;
  commissionEarnedCOP: number;
}

export function calculateProfitAndLoss(input: ProfitAndLossInput): ProfitAndLoss {
  const activeSales = input.sales.filter((sale) => sale.status !== 'ANULADA');
  const activeSaleIds = new Set(activeSales.map((sale) => sale.id));
  const activeReturns = input.returns.filter(
    (ret) => activeSaleIds.has(ret.saleId)
  );

  const productCosts = new Map<string, number>();
  input.products.forEach((product) => {
    productCosts.set(product.id, product.totalCostCOP);
    productCosts.set(product.sku, product.totalCostCOP);
  });

  let grossSalesCOP = 0;
  let discountsCOP = 0;
  let vatCOP = 0;
  let cogsCOP = 0;
  let missingCostItems = 0;

  activeSales.forEach((sale) => {
    grossSalesCOP += sale.subtotalCOP;
    discountsCOP += sale.discountTotalCOP;
    vatCOP += sale.vatCOP;

    sale.items.forEach((item) => {
      const cost = productCosts.get(item.productId) ?? productCosts.get(item.sku);
      if (cost === undefined) {
        missingCostItems += 1;
      } else {
        cogsCOP += cost;
      }
    });
  });

  const returnsCOP = activeReturns.reduce((acc, ret) => acc + ret.subtotalCOP, 0);
  const returnsVatCOP = activeReturns.reduce((acc, ret) => acc + ret.vatCOP, 0);
  const returnedCostCOP = activeReturns.reduce((acc, ret) => acc + ret.costCOP, 0);
  cogsCOP -= returnedCostCOP;
  vatCOP -= returnsVatCOP;

  const netRevenueCOP = grossSalesCOP - returnsCOP;
  const grossProfitCOP = netRevenueCOP - cogsCOP;
  const grossMarginPercent =
    netRevenueCOP > 0 ? (grossProfitCOP / netRevenueCOP) * 100 : 0;

  const returnsBySale = new Map<string, number>();
  activeReturns.forEach((ret) => {
    returnsBySale.set(
      ret.saleId,
      (returnsBySale.get(ret.saleId) || 0) + ret.subtotalCOP
    );
  });

  const employeeRates = new Map<string, number>();
  input.employees.forEach((employee) => {
    employeeRates.set(employee.name, employee.commissionRatePercent / 100);
  });

  const commissionsCOP = activeSales.reduce((acc, sale) => {
    const rate = employeeRates.get(sale.sellerName) ?? 0.02;
    const netSaleRevenue = Math.max(
      0,
      sale.subtotalCOP - (returnsBySale.get(sale.id) || 0)
    );
    return acc + Math.round(netSaleRevenue * rate);
  }, 0);

  const expensesCOP = input.expenses.reduce((acc, expense) => acc + expense.amountCOP, 0);
  const netOperatingIncomeCOP = grossProfitCOP - expensesCOP - commissionsCOP;

  return {
    grossSalesCOP,
    discountsCOP,
    returnsCOP,
    returnsVatCOP,
    netRevenueCOP,
    vatCOP,
    cogsCOP,
    grossProfitCOP,
    grossMarginPercent,
    commissionsCOP,
    expensesCOP,
    netOperatingIncomeCOP,
    missingCostItems,
  };
}

export function calculateSellerPerformance(input: {
  sales: Sale[];
  returns: SaleReturn[];
  employees: Employee[];
}): SellerPerformance[] {
  const map = new Map<string, SellerPerformance>();

  input.employees.forEach((employee) => {
    map.set(employee.name, {
      name: employee.name,
      salesCount: 0,
      totalSalesCOP: 0,
      itemsCount: 0,
      commissionEarnedCOP: 0,
    });
  });

  const returnsBySale = new Map<string, number>();
  input.returns.forEach((ret) => {
    returnsBySale.set(
      ret.saleId,
      (returnsBySale.get(ret.saleId) || 0) + ret.subtotalCOP
    );
  });

  const employeeRates = new Map<string, number>();
  input.employees.forEach((employee) => {
    employeeRates.set(employee.name, employee.commissionRatePercent / 100);
  });

  input.sales
    .filter((sale) => sale.status !== 'ANULADA')
    .forEach((sale) => {
      const seller = sale.sellerName || 'Asesor General';
      const existing = map.get(seller) || {
        name: seller,
        salesCount: 0,
        totalSalesCOP: 0,
        itemsCount: 0,
        commissionEarnedCOP: 0,
      };

      const netSaleRevenue = Math.max(
        0,
        sale.subtotalCOP - (returnsBySale.get(sale.id) || 0)
      );
      const rate = employeeRates.get(seller) ?? 0.02;

      existing.salesCount += 1;
      existing.totalSalesCOP += netSaleRevenue;
      existing.itemsCount += sale.items.length;
      existing.commissionEarnedCOP += Math.round(netSaleRevenue * rate);

      map.set(seller, existing);
    });

  return Array.from(map.values()).filter(
    (seller) =>
      seller.totalSalesCOP > 0 ||
      seller.name.includes('Diana') ||
      seller.name.includes('Carlos')
  );
}
