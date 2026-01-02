import type { Response, Request }  from "express";
import prisma from "./db"

// PUT '/api/expenses/:id'
export async function updateExpenseReqHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { title, amount, category, date, paymentMethod } = req.body;
  
  const updated = await prisma.expense.update({
	where: { id: Number(id) },
	data: { title, amount: parseFloat(amount), category, date: new Date(date), paymentMethod }
  });
  res.json(updated);
};

// DELETE '/api/expenses/:id'
export async function deleteExpenseReqHandler(req: Request, res: Response) {
  const { id } = req.params;

  try {
	await prisma.expense.delete({
	  where: { 
		id: Number(id) 
	  }
	});
	res.json({ success: true, message: "Record permanently deleted" });
  } catch (error) {
	// Handling cases where the ID might not exist
	res.status(404).json({ error: "Expense record not found" });
  }
};

// get '/api/expenses'
export async function expensesReqHandler(req: Request, res: Response) {
  const { month, year } = req.query;
  const startDate = new Date(Number(year), Number(month) - 1, 1);
  const endDate = new Date(Number(year), Number(month), 0);

  try {
	const [expenses, salesRevenueData, expenseSumData] = await Promise.all([
	  prisma.expense.findMany({
		where: { 
		  date: { gte: startDate, lte: endDate } 
		},
		orderBy: { date: 'desc' }
	  }),

	  // Aggregate Total Sales Revenue
	  prisma.sale.aggregate({
		where: {
		  createdAt: { gte: startDate, lte: endDate }
		},
		_sum: {
		  total: true // Sum of the final price paid by customers
		},
		_count: {
		  id: true // Total number of transactions
		}
	  }),

	  // Aggregate Total Expenses
	  prisma.expense.aggregate({
		where: {
		  date: { gte: startDate, lte: endDate }
		},
		_sum: {
		  amount: true
		}
	  })
	]);

	res.json({
	  expenses,
	  revenue: salesRevenueData._sum.total || 0,
	  expensesTotal: expenseSumData._sum.amount || 0,
	  transactionCount: salesRevenueData._count.id,
	});
  }catch(error) {
	res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST '/api/expenses'
export async function newExpenseReqHandler(req: Request, res: Response) {
  const { title, amount, category, date } = req.body;

  try {
	const newExpense = await prisma.expense.create({
	  data: {
		title,
		amount,
		category,
		date: new Date(date),
	  }
	});
	res.json(newExpense);
  } catch (error) {
	console.log(error)
	res.status(500).json({ error: "Could not save expense details to ledger." });
  }
};
