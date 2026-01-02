import type { Response, Request }  from "express";
import prisma from "./db"

async function generateSKU(category: string){
  const prefix = category.slice(0, 3).toUpperCase();
  const suffix = (await prisma.product.count()).toString().padStart(4, '0')
  return `${prefix}-${suffix}`;
};

// post '/api/inventory'
export async function addProductReqHandler(req: Request, res: Response) {
  try {
	const newDistributor: any = {
	  name: req.body.name,
	  sku: await generateSKU(req.body.category || "General"),
	  deleted: false,
	  price: req.body.price,
	  stockCount: req.body.stockCount
	}

	if (req.body.distributorId) {
	  newDistributor.distributorId = parseInt(req.body.distributorId)
	}
	if (req.body.category) {
	  newDistributor.category = req.body.category;
	}

	const item = await prisma.product.create({ data: newDistributor})
	res.json(item);
  }catch(error) {
	console.log("Error creating Inventory", error.message)
  }
};

// get '/api/inventory'
export async function getProductsReqHandler(req: Request, res: Response) {
  const { page = '1', limit = '10', search = '' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  try {
	const where: {deleted: boolean, OR?: any} = {deleted: false}
	if (search) {
	  where.OR =  [
		{ name: { contains: search as string, mode: 'insensitive' } },
		{ category: { contains: search as string, mode: 'insensitive' } },
	  ]
	}

	// Parallel execution for speed
	const [items, totalCount, stats, lowStockCount, outOfStockCount] = await Promise.all([
	  prisma.product.findMany({ where, ...(search ? {} : { skip, take }), orderBy: { name: 'asc' } }),
	  prisma.product.count({ where }),
	  // Calculate Total Inventory Value (Price * Stock)
	  prisma.$queryRaw<any[]>`
		SELECT 
		  SUM("price" * "stockCount") as "total_value", 
		  COUNT("id") as "product_count" 
		FROM "Product" 
		WHERE "deleted" = false
	  `,

	  prisma.product.count({ where: { deleted: false, stockCount: { lt: 10 } } }),
	  prisma.product.count({ where: { deleted: false, stockCount: 0 } })
	]);

	res.json({
	  items,
	  totalPages: Math.ceil(totalCount / take),
	  kpis: {
		totalValue: Number(stats[0]?.total_value || 0),
		distinctProducts: Number(stats[0]?.product_count || 0),
		lowStock: lowStockCount,
		outOfStockCount
	  }
	});
  } catch (error) {
	if (error instanceof Error) {
	// TypeScript now knows 'error' is of type 'Error'
	res.status(500).json({ error: error.message });
  } else {
	// Handle cases where something other than an Error object was thrown
	res.status(500).json({ error: 'An unknown error occurred:' });
  }

  }
};

// put '/api/inventory/:id'
export async function updateProductReqHandler(req: Request, res: Response) {
  const item = await prisma.product.update({
	where: { id: parseInt(req.params.id) },
	data: req.body
  });
  res.json(item);
};

// delete '/api/inventory/:id'
export async function deleteProductReqHandler(req: Request, res: Response){
  // Soft delete for safety
  try {
	const item = await prisma.product.update({
	  where: { id: parseInt(req.params.id) },
	  data: { deleted: true }
	});
	res.json(item);
  }catch(error) {
	console.log("ERROR deleting Inventory Item", error.message)
	res.status(500).json({error: "Internal Db Erroo!"});
  }
};
