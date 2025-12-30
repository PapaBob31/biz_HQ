import { PrismaClient } from './generated/client';
import * as bcrypt from 'bcryptjs';
import { PrismaPostgresAdapter } from '@prisma/adapter-ppg'

const prisma = new PrismaClient({
  adapter: new PrismaPostgresAdapter({
    connectionString: process.env.DATABASE_URL as string,
  }),
})

// const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. Create Admin Account
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.employee.create({
    data: {
      email: "",
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 2. Seed Products (Inventory)
  const products = [
    { name: 'Espresso Beans 1kg', category: 'Coffee', price: 25.0, stockCount: 15, sku: 'COF-001', deleted: false },
    { name: 'Oat Milk 1L', category: 'Dairy', price: 4.5, stockCount: 48, sku: 'DRY-002', deleted: false },
    { name: 'Paper Cups (50pk)', category: 'Supplies', price: 12.0, stockCount: 5, sku: 'SUP-003', deleted: false }, // Low Stock
    { name: 'Caramel Syrup', category: 'Syrups', price: 8.0, stockCount: 12, sku: 'SYR-004', deleted: false },
    { name: 'Blueberry Muffin', category: 'Pastry', price: 3.5, stockCount: 20, sku: 'PAS-005', deleted: false },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product
    });
  }

  // 3. Seed Expenses (Recent data for the Ledger)
  const today = new Date();
  const expenses = [
    { 
      title: 'Monthly Rent', 
      amount: 1200.0, 
      category: 'Utilities', 
      date: new Date(today.getFullYear(), today.getMonth(), 1) 
    },
    { 
      title: 'Electricity Bill', 
      amount: 150.0, 
      category: 'Utilities', 
      date: new Date(today.getFullYear(), today.getMonth(), 5) 
    },
    { 
      title: 'Marketing Flyer Print', 
      amount: 45.0, 
      category: 'Marketing', 
      date: new Date(today.getFullYear(), today.getMonth(), 10) 
    },
  ];

  // Expenses usually don't have a unique ID like SKU, 
  // so we check if an expense with the same title and date exists
  for (const exp of expenses) {
    const existing = await prisma.expense.findFirst({
      where: { title: exp.title, date: exp.date }
    });
    
    if (!existing) {
      await prisma.expense.create({ data: exp });
    }
  }

  console.log('✅ Seeding complete: Admin created, Inventory stocked, Expenses logged.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });