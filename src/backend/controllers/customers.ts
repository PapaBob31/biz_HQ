import {type Response, type Request} from 'express'
import prisma from "./db"


//  post '/api/customers'
export async function newCustomerReqHandler(req: Request, res: Response) {
  const customer = await prisma.customer.create({ data: req.body });
  res.json(customer);
};

//  get '/api/customers'
export async function customersReqHandler(req: Request, res: Response) {
  const { search } = req.query;
  const customers = await prisma.customer.findMany({
	where: {
	  OR: [
		{ firstName: { contains: String(search || ""), mode: 'insensitive' } },
		{ lastName: { contains: String(search || ""), mode: 'insensitive' } },
		{ phone: { contains: String(search || "") } }
	  ]
	},
	orderBy: { lastName: 'asc' }
  });
  res.json(customers);
};

// put  '/api/customers/:id'
export async function customerUpdateReqHandler(req: Request, res: Response) {
  const updated = await prisma.customer.update({
	where: { id: Number(req.params.id) },
	data: req.body
  });
  res.json(updated);
};

// DELETE '/api/customers/:id'
export async function deleteCustomerReqHandler(req: Request, res: Response) {
  try {
    await prisma.customer.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  }catch(error) {
    res.status(500).json({errorMsg: "Internal DB Error!", data: null, msg: null})
  }
};

