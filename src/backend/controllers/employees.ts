import type { Response, Request }  from "express";
import prisma from "./db"
import bcrypt from 'bcryptjs';

// get '/api/employees'
export async function getEmployeesReqHandler(_req: Request, res: Response) {
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
};

// put '/api/employees/:id'
export async function updateEmployeeReqHandler(req: Request, res: Response) {
  try {
	const item = await prisma.employee.update({
	  where: { id: parseInt(req.params.id) },
	  data: req.body
	});
	res.json(item);
  }catch(error) {
	console.log(error)
	res.status(500).json({error: "Interal Server Error"})
  }
};

// delete '/api/employees/:id'
export async function deleteEmployeeReqHandler(req: Request, res: Response) {
  try {
	const item = await prisma.employee.delete({
	  where: { id: parseInt(req.params.id) },
	});
	res.status(200).json(item)
  }catch(error) {
	console.log("Error deleteing user", error.message)
	res.status(500).json({error: "Internal DB Error!"})
  }
};


// post '/api/employees'
export async function newEmployeeReqHandler(req: Request, res: Response) {
  const { employeeData, requesterRole } = req.body;

  if (requesterRole !== 'ADMIN') {
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
		role: employeeData.role.toUpperCase(),
	  },
	});

	res.status(201).json(newEmployee);
  } catch (error) {
	res.status(500).json({ success: false, message: "Database Error" });
  }
};
