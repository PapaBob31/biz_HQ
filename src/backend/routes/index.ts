import { Router } from "express"
import { newCustomerReqHandler, customersReqHandler, deleteCustomerReqHandler, customerUpdateReqHandler } from "../controllers/customers"
import { expensesReqHandler, deleteExpenseReqHandler, newExpenseReqHandler, updateExpenseReqHandler} from "../controllers/expenses"
import { getEmployeesReqHandler, updateEmployeeReqHandler, deleteEmployeeReqHandler, newEmployeeReqHandler } from "../controllers/employees"
import { addProductReqHandler, getProductsReqHandler, updateProductReqHandler, deleteProductReqHandler } from "../controllers/inventory"
import { distributorsReqHandler, distributorProductsReqHandler, newDistributorReqHandler, updateDistributorReqHandler, 
	deleteDistributorReqHandler } from "../controllers/distributors"
import { quickStatsReqHandler, topProductsReqHandler, revenueTrendReqHandler, businessSummaryReqHandler } from "../controllers/analytics"
import { newSalesCheckout } from "../controllers/sales"

export const router = Router()

router.get("/api/employees", getEmployeesReqHandler)
router.put("/api/employees/:id",  updateEmployeeReqHandler)
router.delete("/api/employees/:id",  deleteEmployeeReqHandler)
router.post("/api/employees", newEmployeeReqHandler)

router.post("/api/inventory", addProductReqHandler)
router.get("/api/inventory", getProductsReqHandler)
router.put("/api/inventory/:id", updateProductReqHandler)
router.delete("/api/inventory/:id", deleteProductReqHandler)

router.get("/api/distributors", distributorsReqHandler)
router.get("/api/distributors/:id/products", distributorProductsReqHandler)
router.delete("/api/distributors/:id", deleteDistributorReqHandler)
router.put("/api/distributors/:id", updateDistributorReqHandler)
router.post("/api/distributors", newDistributorReqHandler)

router.get("/api/expenses", expensesReqHandler)
router.delete("/api/expenses/:id", deleteExpenseReqHandler)
router.put("/api/expenses/:id", updateExpenseReqHandler)
router.post("/api/expenses", newExpenseReqHandler)

router.post("/api/customers", newCustomerReqHandler)
router.get("/api/customers", customersReqHandler) 
router.delete("/api/customers/:id", deleteCustomerReqHandler)
router.put("/api/customers/:id", customerUpdateReqHandler)

router.get('/api/business-analytics/quick-stats', quickStatsReqHandler)
router.get('/api/business-analytics/top-products', topProductsReqHandler)
router.get('/api/business-analytics/revenue-trend', revenueTrendReqHandler)
router.get('/api/business-analytics/business-summary', businessSummaryReqHandler)

router.post('api/sales', newSalesCheckout)