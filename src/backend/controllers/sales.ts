import type { Response, Request }  from "express";
import prisma from "./db"

// POST '/api/sales'
export async function createNewSaleReqHandler(req: Request, res: Response) {
  const { total, method, employeeName, totalAfterTax, tax } = req.body;
  
  if (method === 'CLOVER') {
	// Clover Flex Simulation
	console.log("Triggering Clover Cloud Pay Display...");
  }


  const sale = await prisma.sale.create({
	data: { total, method, employeeName, totalAfterTax, tax }
  });
  res.json(sale);
};

// 	GET '/api/sales'
export async function salesReqHandler(req: Request, res: Response) {
  const { limit } = req.query;
  
  try {
	const sales = await prisma.sale.findMany({
	  // If limit is provided, use it; otherwise fetch all
	  take: limit ? parseInt(limit as string) : undefined,
	  orderBy: {
		createdAt: 'desc'
	  },
	  include: {
		Customer: { select: { firstName: true, lastName: true } },
		// Optionally include item count without pulling all item data
		_count: { select: { ProductSold: true } }
	  }
	});
	console.log(sales)
	res.json(sales);
  } catch (error) {
	console.log(error)
	res.status(500).json({ error: "Failed to fetch sales history" });
  }
};

// POST '/api/sales/checkout'
export async function newSalesCheckout(req: Request, res: Response) {
  const { cart, paymentMethod, subtotal, tax, totalAfterTax, employeeName } = req.body;

  try {
	const result = await prisma.$transaction(async (tx) => {
	  // 1. Create Sale Record
	  const sale = await tx.sale.create({
		data: {
		  total: subtotal,
		  totalAfterTax,
		  tax,
		  employeeName,
		  method: paymentMethod,
		  ProductSold: {
			create: cart.map((item: any) => ({
			  productId: item.id,
			  quantity: item.quantity,
			  priceAtSale: item.price
			}))
		  }
		}
	  });

	  // 2. Decrement Inventory
	  for (const item of cart) {
		await tx.product.update({
		  where: { id: item.id },
		  data: { stockCount: { decrement: item.quantity } }
		});
	  }

	  return sale;
	});

	// 3. Trigger Printer through IPC if configured
	// ipcMain.emit('print-receipt', result);

	res.json({ success: true, saleId: result.id });
  } catch (error) {
	res.status(500).json({ error: "Checkout failed: " + error.message });
  }
};