import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path'
import { fileURLToPath } from 'url';
import { PrismaClient } from '../prisma/generated/client'
import express from 'express'
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'


const prisma = new PrismaClient({
  adapter: new PrismaPostgresAdapter({
    connectionString: process.env.DATABASE_URL as string,
  }),
})

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The built files will live in dist
const DIST = path.join(__dirname, '../dist')

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });
  mainWindow.webContents.openDevTools()

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(DIST, 'index.html'))
  } 
}


const server = express()
server.use(express.json())

// API: Employees
server.get('/api/employees', async (_req, res) => {
  try {
    res.json(await prisma.employee.findMany({
      select: {
          id: true,
          username: true,
          email: true,
          role: true,
        }
    }))
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve staff records." 
    });
  }
})

server.get('/api/inventory', async (req, res) => {
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
});


server.post('/api/employees', async (req, res) => {
  const { employeeData, requesterRole } = req.body;

  if (requesterRole !== 'Admin') {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  try {
    // Hash the password with a salt round of 10
    const hashedPassword = await bcrypt.hash(employeeData.password, 10);

    const newEmployee = await prisma.employee.create({
      data: {
        username: employeeData.username,
        email: employeeData.email,
        password: hashedPassword,
        role: employeeData.role,
      },
    });

    res.status(201).json({ success: true, data: newEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database Error" });
  }
});


// CRUD: Create, Update, Delete
server.post('/api/inventory', async (req, res) => {
  const item = await prisma.product.create({ data: req.body });
  res.json(item);
});

server.put('/api/inventory/:id', async (req, res) => {
  const item = await prisma.product.update({
    where: { id: parseInt(req.params.id) },
    data: req.body
  });
  res.json(item);
});

// GET all active distributors
server.get('/api/distributors', async (req, res) => {
  try {
    const distributors = await prisma.distributor.findMany({
      where: { deleted: false },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });
    res.json(distributors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch distributors" });
  }
});

// POST new distributor (Optional, for managing the list)
server.post('/api/distributors', async (req, res) => {
  const { name, contactEmail, phone } = req.body;
  const newDist = await prisma.distributor.create({
    data: { name, contactEmail, phone }
  });
  res.json(newDist);
});

server.delete('/api/inventory/:id', async (req, res) => {
  // Soft delete for safety
  const item = await prisma.product.update({
    where: { id: parseInt(req.params.id) },
    data: { deleted: true }
  });
  res.json(item);
});


server.put('/api/distributors/:id', async (req, res) => {
  const item = await prisma.distributor.update({
    where: { id: parseInt(req.params.id) },
    data: req.body
  });
  res.json(item);
});

server.delete('/api/distributors/:id', async (req, res) => {
  await prisma.distributor.update({
    where: { id: parseInt(req.params.id) },
    data: { deleted: true }
  });
  res.json({ success: true });
});


// UPDATE expense
server.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date, paymentMethod } = req.body;
  
  const updated = await prisma.expense.update({
    where: { id: Number(id) },
    data: { title, amount: parseFloat(amount), category, date: new Date(date), paymentMethod }
  });
  res.json(updated);
});

// DELETE expense (Soft Delete)
// DELETE expense (Actual Hard Delete)
server.delete('/api/expenses/:id', async (req, res) => {
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
});


server.get('/api/expenses', async (req, res) => {
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
});

server.post('/api/expenses', async (req, res) => {
  const { title, amount, category, date } = req.body;

  try {
    const newExpense = await prisma.expense.create({
      data: {
        title,
        amount,
        category,
        date: new Date(date),
        deleted: false
      }
    });
    res.json(newExpense);
  } catch (error) {
    res.status(500).json({ error: "Could not save expense details to ledger." });
  }
});


// CREATE Customer
server.post('/api/customers', async (req, res) => {
  const customer = await prisma.customer.create({ data: req.body });
  res.json(customer);
});

// GET All Customers (with search)
server.get('/api/customers', async (req, res) => {
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
});

// UPDATE Customer
server.put('/api/customers/:id', async (req, res) => {
  const updated = await prisma.customer.update({
    where: { id: Number(req.params.id) },
    data: req.body
  });
  res.json(updated);
});

// DELETE Customer
server.delete('/api/customers/:id', async (req, res) => {
  await prisma.customer.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

server.get('/api/business-stats', async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    const [todaySales, totalInventory, lowStockCount, customerCount] = await Promise.all([
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
    ]);

    res.json({
      todayRevenue: todaySales._sum.total || 0,
      totalInventory,
      lowStockCount,
      customerCount
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

server.get('/api/analytics/top-products', async (req, res) => {
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
});

server.get('/api/analytics/revenue-trend', async (req, res) => {
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
});


server.post('/api/sales', async (req, res) => {
  const { total, method, employeeName, totalAfterTax, tax } = req.body;
  
  if (method === 'CLOVER') {
    // Clover Flex Simulation
    console.log("Triggering Clover Cloud Pay Display...");
  }


  const sale = await prisma.sale.create({
    data: { total, method, employeeName, totalAfterTax, tax }
  });
  res.json(sale);
})

server.get('/api/sales', async (req, res) => {
  const { limit } = req.query;
  
  try {
    const sales = await prisma.sale.findMany({
      // If limit is provided, use it; otherwise fetch all
      take: limit ? parseInt(limit as string) : undefined,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: { select: { name: true } },
        // Optionally include item count without pulling all item data
        _count: { select: { ProductSold: true } }
      }
    });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sales history" });
  }
});

server.post('/api/sales/checkout', async (req, res) => {
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
});

server.get('/api/reports/business-summary', async (req, res) => {
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
        // For accurate valuation, raw SQL is often better than Prisma aggregate for (price * stock)
        totalItems: inventoryStats[0]?.product_count || 0,
        totalValue: inventoryStats[0]?.total_value || 0
      },
      expenses: expenseStats._sum.amount || 0,
      categories: Object.values(categoryMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to compile report data" });
  }
});

server.listen(3000)

const printer = require('pdf-to-printer'); // Common library for Windows Electron apps

// 1. Get List of System Printers
ipcMain.handle('get-printers', async () => {
  return await printer.getPrinters();
});

ipcMain.handle('generate-pdf-report', async (event) => {
  const printWindow = new BrowserWindow({ show: false });
  
  // Load a specific print-friendly URL or HTML string
  await printWindow.loadURL('http://localhost:3000/report-print-view');

  const options = {
    marginsType: 0,
    pageSize: 'A4',
    printBackground: true,
    printSelectionOnly: false,
    landscape: false
  };

  const data = await printWindow.webContents.printToPDF(options);
  const filePath = path.join(process.env.HOME || process.env.USERPROFILE, 'Documents', `POS_Report_${Date.now()}.pdf`);
  
  fs.writeFileSync(filePath, data);
  return filePath;
});

// 2. Test Hardware Logic
ipcMain.handle('test-hardware', async (event, { action, printerName }) => {
  if (!printerName) return { success: false, error: "No printer selected" };

  try {
    if (action === 'print') {
      // For a Star printer, we send a simple text document
      // In production, you would generate a small PDF or use raw ESC/POS
      console.log(`Sending test print to ${printerName}`);
      return { success: true };
    }

    // if (action === 'drawer') {
    //   // STAR DRAWER KICK CODE (Hex: 07)
    //   // We send a specific "Pulse" command to the printer to trigger the RJ11 port
    //   const fs = require('fs');
    //   const kickCommand = Buffer.from([0x07]); // Standard Star "Kick" pulse
    //   // Note: This requires a library like 'direct-print-to-printer' to send raw buffers
    //   return { success: true };
    // }
  } catch (err) {
    return { success: false, error: err.message };
  }
});



ipcMain.handle('user-login', async (event, { username, password, role }) => {
  try {
    const user = await prisma.employee.findUnique({
      where: { username }
    });

    if (!user) return { success: false, message: "User not found" };

    // Compare the provided plain-text password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch && user.role === role) {
      // Return user data (excluding the password hash for security)
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } else {
      return { success: false, message: "Invalid credentials" };
    }
  } catch (error) {
    return { success: false, message: "Login service error" };
  }
});

app.whenReady().then(createWindow);
