import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seed...');

  // Product names from your existing data
  const productNames = [
    'boots',
    'cable',
    'caramel syrup',
    'Denim Jacket',
    'Desk Lamp',
    'Eraser',
    'helmet'
  ];

  // Product prices (matching your data)
  const productPrices = {
    'boots': 30.00,
    'cable': 10.00,
    'caramel syrup': 10.00,
    'Denim Jacket': 85.00,
    'Desk Lamp': 4500.00,
    'Eraser': 5.00,
    'helmet': 50.00
  };

  const paymentMethods = ['Cash', 'Clover'];

  // Helper function to get random item from array
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Helper function to get random number between min and max
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Get start of current week (Sunday)
  const getStartOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek); // Go back to Sunday
    sunday.setHours(0, 0, 0, 0);
    
    return sunday;
  };

  // Get end of week (Friday 11:59:59 PM)
  const getEndOfWeek = () => {
    const startOfWeek = getStartOfWeek();
    const friday = new Date(startOfWeek);
    friday.setDate(startOfWeek.getDate() + 5); // Sunday + 5 = Friday
    friday.setHours(23, 59, 59, 999);
    
    return friday;
  };

  // Helper function to get random date between Sunday and Friday
  const randomDateThisWeek = () => {
    const startOfWeek = getStartOfWeek();
    const endOfWeek = getEndOfWeek();
    const now = new Date();
    
    // If we're past Friday, use Friday as end date, otherwise use current time
    const actualEnd = endOfWeek
    
    // Calculate difference in milliseconds
    const diffMs = actualEnd.getTime() - startOfWeek.getTime();
    
    // Generate random timestamp within the range
    const randomMs = Math.random() * diffMs;
    const randomDate = new Date(startOfWeek.getTime() + randomMs);
    
    return randomDate;
  };

  // Get week range for logging
  const startOfWeek = getStartOfWeek();
  const endOfWeek = getEndOfWeek();
  const now = new Date();
  const actualEnd = now > endOfWeek ? endOfWeek : now;
  
  console.log(`Creating sales for current week (Sunday-Friday):`);
  console.log(`${startOfWeek.toLocaleDateString()} to ${actualEnd.toLocaleDateString()}`);

  // Create 20 sales
  for (let i = 1; i <= 20; i++) {
    // Randomly select 1-4 products for this sale
    const numProducts = randomInt(1, 4);
    const selectedProducts = [];
    const usedProducts = new Set();

    // Select unique products for this sale
    while (selectedProducts.length < numProducts) {
      const productName = randomItem(productNames);
      if (!usedProducts.has(productName)) {
        usedProducts.add(productName);
        selectedProducts.push({
          name: productName,
          price: productPrices[productName],
          quantity: randomInt(1, 3)
        });
      }
    }

    // Calculate sale totals
    const subTotal = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const tax = subTotal * 0.13; // 13% tax
    console.log(selectedProducts)
    // Randomly decide if loyalty discount applies (30% chance)
    const loyaltyDiscount =  0;
    
    const total = subTotal + tax - loyaltyDiscount;

    // Get random date this week (Sunday to Friday)
    const saleDate = randomDateThisWeek();

    // Create sale with products
    const sale = await prisma.sale.create({
      data: {
        subTotal: parseFloat(subTotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        loyaltyDiscount: loyaltyDiscount,
        method: randomItem(paymentMethods),
        employeeName: 'adedamola',
        createdAt: saleDate,
        ProductSold: {
          create: selectedProducts.map(p => ({
            productName: p.name,
            price: p.price,
            discount: 0,
            quantity: p.quantity
          }))
        }
      },
      include: {
        ProductSold: true
      }
    });

    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][saleDate.getDay()];
    console.log(`Created Sale #${sale.id}: $${sale.total.toFixed(2)} (${sale.method}) on ${dayName} ${saleDate.toLocaleString()} - ${sale.ProductSold.length} items`);
  }

  console.log('\nSeed completed successfully!');
  console.log(`Created 20 sales between ${startOfWeek.toLocaleDateString()} (Sunday) and ${actualEnd.toLocaleDateString()}`);
}

main()
  .catch((e) => {
    // console.log((e.meta!.driverAdapterError as any).cause.constraint.fields as string[])
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });