import type { Response, Request }  from "express";
import prisma from "./db"


async function getYesterdayRevenue()  {
  const today = new Date();
  // Start of yesterday (00:00:00.000)
  const startOfYesterday = new Date(today);
  startOfYesterday.setDate(today.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  // End of yesterday (23:59:59.999)
  const endOfYesterday = new Date(today);
  endOfYesterday.setDate(today.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999);

  const aggregation = await prisma.sale.aggregate({
	where: {
	  createdAt: {
		gte: startOfYesterday,
		lte: endOfYesterday,
	  },
	},
	_sum: {
	  total: true,
	},
  });

  return aggregation._sum.total || 0;
};

// get '/api/business-analytics/quick-stats'
export async function quickStatsReqHandler(req: Request, res: Response) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999); // Last day of previous the month

  try {
	const [todaySales, totalInventory, lowStockCount, customerCount, monthSales, yesterdayRevenue] = await Promise.all([
	  // 1. Today's Revenue
	  prisma.sale.aggregate({
		where: { createdAt: { gte: todayStart } },
		_sum: { total: true }
	  }),
	  // 2. Number of Inventory Items (Total SKUs)
	  prisma.product.count({ where: { deleted: false } }),
	  // 3. Number of items with low stock (e.g., < 10)
	  prisma.product.count({
		where: { 
		  deleted: false,
		  stockCount: { lt: 10 } 
		}
	  }),
	  // 4. All Inventory Items (Full list)
	  prisma.customer.count(),

	  //5. Current Month Revenue
	  prisma.sale.aggregate({
		where: {
		  createdAt: {
			gte: startDate,
			lte: endDate,
		  },
		},
		_sum: {
		  total: true,
		},
	  }),

	  getYesterdayRevenue()
   ]);

	res.json({
	  todayRevenue: todaySales._sum.total || 0,
	  totalInventory,
	  lowStockCount,
	  customerCount,
	  monthRevenue: monthSales._sum.total || 0,
	  yesterdayRevenue
	});
  } catch (error) {
	res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};


// get '/api/business-analytics/top-products'
export async function topProductsReqHandler(req: Request, res: Response) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  try {
	const topProductsSold = await prisma.productSold.groupBy({
	  by: ['productName'],
	  where: {
		Sale: { createdAt: { gte: monthStart } }
	  },
	  _sum: { quantity: true },
	  orderBy: { _sum: { quantity: 'desc' } },
	  take: 5,
	});

	const detailedProducts = await Promise.all(
	  topProductsSold.map(async (item) => {
		const product = await prisma.product.findUnique({ 
		  where: { name: item.productName },
		  select: { name: true, category: true }
		});
		return { 
		  name: product?.name || "Unknown", 
		  category: product?.category,
		  sold: item._sum.quantity 
		};
	  })
	);

	res.json(detailedProducts);
  } catch (error) {
	res.status(500).json({ error: "Failed to fetch top products" });
  }
};

// get '/api/business-analytics/revenue-trend'
export async function revenueTrendReqHandler(req: Request, res: Response) {
  try {
	const months = [];
	const now = new Date();

	for (let i = 4; i >= 0; i--) {
	  const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
	  const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

	  const totalRevenue = await prisma.sale.aggregate({
		where: { createdAt: { gte: start, lte: end } },
		_sum: { total: true }
	  });

	  months.push({
		month: start.toLocaleString('default', { month: 'short' }),
		revenue: totalRevenue._sum.total || 0
	  });
	}

	res.json(months);
  } catch (error) {
	res.status(500).json({ error: "Failed to generate revenue trend" });
  }
};


// get '/api/reports/business-summary'
export async function businessSummaryReqHandler(req: Request, res: Response) {
  try {
	const [salesStats, inventoryStats, lowStockCount, expenseStats] = await Promise.all([
	  // 1. Sales Summary (Revenue, Avg Order, Transaction Count)
	  prisma.sale.aggregate({
		_sum: { total: true },
		_avg: { total: true },
		_count: { id: true }
	  }),

	  // 2. Inventory Stats (Value at Cost vs potential Retail)
	  prisma.$queryRaw<{total_value: number; product_count: number}[]>`
		SELECT 
		  SUM("price" * "stockCount") as "total_value", 
		  COUNT("id") as "product_count" 
		FROM "Product" 
		WHERE "deleted" = false
	  `,
	  // 3. Low Stock Count
	  prisma.product.count({
		where: { deleted: false, stockCount: { lt: 10 } }
	  }),

	  // 4. Expenses Total
	  prisma.expense.aggregate({
		_sum: { amount: true }
	  })
	]);

	// 5. Category Breakdown (Top Categories by Sales)
	const topCategories = await prisma.productSold.findMany({
	  include: { Product: true },
	  take: 100 // We will aggregate these in JS for simplicity
	});

	const categoryMap = topCategories.reduce((acc: any, item) => {
	  const cat = item.Product.category || 'Uncategorized';
	  if (!acc[cat]) acc[cat] = { name: cat, sold: 0, revenue: 0 };
	  acc[cat].sold += item.quantity;
	  acc[cat].revenue += item.quantity * item.price;
	  return acc;
	}, {});

	res.json({
	  sales: {
		totalRevenue: salesStats._sum.total || 0,
		averageOrder: salesStats._avg.total || 0,
		transactions: salesStats._count.id
	  },
	  inventory: {
		lowStock: lowStockCount,
		totalItems: inventoryStats[0]?.product_count || 0,
		totalValue: inventoryStats[0]?.total_value || 0
	  },
	  expenses: expenseStats._sum.amount || 0,
	  categories: Object.values(categoryMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5)
	});
  } catch (error) {
	res.status(500).json({ error: "Failed to compile report data" });
  }
};