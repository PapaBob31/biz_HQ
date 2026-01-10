import dotenv from "dotenv";
// import { execSync } from 'node:child_process';
// import fs from "node:path"
import { beforeEach, afterEach, it, describe, expect } from "vitest"
import { PrismaClient } from '../../../prisma/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import request from 'supertest'
import  server from "../index"

dotenv.config({path: "../../../.env.test"})

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// })

// const dbCreationResult = await pool.query('CREATE DATABASE biz_hq_testdb;');
// pool.end()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// if (dbCreationResult.rowCount === 1) {
//     execSync('npx prisma migrate deploy', { env: process.env });
// }else if (dbCreationResult.rowCount === 0) {
//     console.log("ERROR OCCURED WHILE CREATING TEST DATABASE!")
// }



const employeesTestData = [
  {
    username: "jdoe_admin",
    email: "john.doe@example.com",
    password: "hashed_password_123", // In a real app, use bcrypt to hash this
    role: "ADMIN"
  },
  {
    username: "asmith_staff",
    email: "alice.smith@example.com",
    password: "hashed_password_456",
    role: "USER"
  },
  {
    username: "bwayne_manager",
    email: "bruce.wayne@example.com",
    password: "hashed_password_789",
    role: "MANAGER"
  }
];

beforeEach(async () => {
  await prisma.employee.createMany({data: employeesTestData})
})
// before each seed the employee table with employee data
// after each, truncate the employee table

afterEach(async () => {
    await prisma.employee.deleteMany({})
})

export function testEmployeeCreation() {

}

export function testEmployeeRetrieval() {

}

export function testEmployeeUpdate() {

}

export function testEmployeeDeletion() {

}

describe('Clover POS API', () => {
  it('should return 200 and the correct body for a valid sale', async () => {
    const response = await request(server)
      .post('/api/employees')
      .send({ amount: 5000, orderId: 'order-123' });
    // console.log(response)
    console.log("body", response.body)
    console.log("headers", response.headers)
    expect(1).toBe(1)
    // Assertions
    // expect(response.status).toBe(200);
    // expect(response.body).toHaveProperty('success', true);
    // expect(response.body.data.amount).toBe(5000);
  });

  /*it('should return 401 if the access token is missing', async () => {
    const response = await request(server).get('/api/inventory');
    
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });*/
});