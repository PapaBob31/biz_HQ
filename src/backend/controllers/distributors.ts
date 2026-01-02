import type { Response, Request }  from "express";
import prisma from "./db"

// get distributors
export async function distributorsReqHandler(req: Request, res: Response) {
  try {
	const distributors = await prisma.distributor.findMany({
	  where: { deleted: false },
	  orderBy: { name: 'asc' },
	  select: {
		id: true,
		name: true,
		contactEmail: true,
		phone: true
	  }
	});
	res.json(distributors);
  } catch (error) {
	res.status(500).json({ error: "Failed to fetch distributors" });
  }
};


// get '/api/distributors/:id/products'
export async function distributorProductsReqHandler(req: Request, res: Response) {
  const { id } = req.params;
  try {
	const products = await prisma.product.findMany({
	  where: { 
		distributorId: Number(id),
		deleted: false 
	  },
	  orderBy: { name: 'asc' }
	});
	res.json(products);
  } catch (error) {
	res.status(500).json({ error: "Could not fetch distributor products" });
  }
};

// POST '/api/distributors'
export async function newDistributorReqHandler(req: Request, res: Response) {
  const { name, contactEmail, phone } = req.body;
  const newDist = await prisma.distributor.create({
	data: { name, contactEmail, phone }
  });
  res.json(newDist);
};



// put '/api/distributors/:id'
export async function updateDistributorReqHandler(req: Request, res: Response) {
  const item = await prisma.distributor.update({
	where: { id: parseInt(req.params.id) },
	data: req.body
  });
  res.json(item);
};

// delete '/api/distributors/:id'
export async function deleteDistributorReqHandler(req: Request, res: Response) {
  await prisma.distributor.update({
	where: { id: parseInt(req.params.id) },
	data: { deleted: true }
  });
  res.json({ success: true });
};

