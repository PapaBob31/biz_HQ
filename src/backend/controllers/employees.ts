import type { Response, Request }  from "express";
import prisma from "./db"
import bcrypt from 'bcryptjs';
import { type ModRequest } from "../middlewares"
import { generateAccessToken, sendOtpToEmail, generateOtpWithExpiry } from "../utils"

// get '/api/employees'
export async function getEmployeesReqHandler(req: ModRequest, res: Response) {
	if (req.user.role !== 'ADMIN'){
		return res.status(403).json({message: "Unauthorized", success: false})
	}
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
		console.error("Employee Fetch error:", error);
		res.status(500).json({ 
			success: false, 
			message: "Failed to retrieve staff records." 
		});
	}
};

// put '/api/employees/:id'
export async function updateEmployeeDetailsReqHandler(req: ModRequest, res: Response) {
	if (req.user.role !== 'ADMIN'){
		return res.status(403).json({message: "Unauthorized", success: false})
	}

	const userToUpdate = await prisma.employee.findUnique({where: {id: parseInt(req.params.id)}})
	if (!userToUpdate) {
		return res.status(404).json({message: "User to update was not found", success: false})
	}

	if (req.body.password || req.body.id || req.body.otp_and_expirationts || req.body.verified) {
		return res.status(400).json({message: "One or more invalid fields aren't allowed", success: false})
	}

	let updatePaylod = req.body

	if (userToUpdate.role !== 'ADMIN' && updatePaylod.role === 'ADMIN') {
		const otpAndExpiryStr = generateOtpWithExpiry()
		updatePaylod = {...req.body, verified: false, otp_and_expirationts: otpAndExpiryStr}
	}

	try {
		await prisma.employee.update({
			where: { id: parseInt(req.params.id) },
			data: updatePaylod,
			select: {id: true, username: true, email: true, role: true}
		});
		if (updatePaylod.role === 'ADMIN'){
			sendOtpToEmail(userToUpdate.email, updatePaylod.otp_and_expirationts.split('|')[0])
		}
		return res.status(200).json({message: "Employee data updated", success: true});
	}catch(error) {
		console.log("Error Updating Employee", error)
		return res.status(500).json({error: "Internal Server Error"})
	}
};

export async function updateEmployeePasswordReqHandler(req: ModRequest, res: Response) {
	if (req.user.role !== 'ADMIN') {
		return res.status(403).json({message: "Unauthorized"})
	}
	if (!req.body.password) {
		return res.status(400).json({message: "Invalid Request. Missing field: password", success: false})
	}
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		const employee = await prisma.employee.update({
			where: { id: parseInt(req.params.id) },
			data: {password: hashedPassword}
		});
		return res.status(201).json(employee);
	} catch (error) {
		return res.status(500).json({ success: false, message: "Database Error" });
	}
}

// delete '/api/employees/:id'
export async function deleteEmployeeReqHandler(req: ModRequest, res: Response) {
	if (req.user.role !== 'ADMIN'){
		return res.status(403).json({message: "Unauthorized", success: false})
	}

	const employees = await prisma.employee.findMany({where:{role: 'ADMIN'}})
	if (employees.length === 1 && employees[0].id === parseInt(req.params.id)){
		return res.status(400).json({message: "You cannot delete the only admin account in the system", success: false})
	}
	const employeeToDelete = await prisma.employee.findUnique({where: {id: parseInt(req.params.id)}})
	if (!employeeToDelete) {
		return res.status(404).json({message: "Employee to delete was not found", success: false})
	}
	
	try {
		const item = await prisma.employee.delete({
			where: { id: parseInt(req.params.id) },
		});
		return res.status(200).json(item)
	}catch(error) {
		console.log("Error deleting Employee", error)
		return res.status(500).json({error: "Internal DB Error!"})
	}
};




export async function otpReqHandler(req: Request, res: Response) {
	const { email } = req.body;
	if (!email) return res.status(404).json({ message: "Employee not found", success: false });
	const employee = await prisma.employee.findUnique({ where: { email } });
	if (!employee) return res.status(404).json({ message: "Employee not found", success: false });

	if (employee.role !== 'ADMIN') {
		return res.status(403).json({message: "Access Denied", success: false})
	}

	// Rate Limiting Check (If otp exists, check if it was generated < 1 minute ago)
	if (employee.otp_and_expirationts) {
		const [_, timestamp] = employee.otp_and_expirationts.split('|');
		const createdTime = parseInt(timestamp) - (15 * 60 * 1000);
		if (Date.now() - createdTime < 60000) {
			return res.status(429).json({ message: "Please wait 1 minute before requesting a new OTP", success: false });
		}
	}

	const newOtpData = generateOtpWithExpiry();

	await prisma.employee.update({
		where: { email },
		data: { otp_and_expirationts: newOtpData }
	});

	await sendOtpToEmail(email, newOtpData.split('|')[0])

	res.json({ message: "OTP sent successfully", success: true });
};


export async function otpVerificationReqHandler(req: Request, res: Response) {
	const { email, otp } = req.body;
	let employee = null;

	try {
		employee = await prisma.employee.findUnique({ where: { email } });
	}catch(error) {
		console.log(error.message)
		return res.status(500).json({message: "Something went wrong. Please try again", success: false})
	}
	console.log(employee)

	if (!employee || !employee.otp_and_expirationts || employee.verified) {
		return res.status(400).json({ message: "Invalid request", success: false });
	}

	const [dbOtp, expiry] = employee.otp_and_expirationts.split('|');

	if (dbOtp !== otp) {
		return res.status(400).json({ message: "Incorrect OTP code", success: false });
	}

	if (Date.now() > parseInt(expiry)) {
		return res.status(400).json({ message: "OTP has expired", success: false });
	}

	try {
		await prisma.employee.update({
			where: { email },
			data: { 
				verified: true, 
				otp_and_expirationts: null // Clear the OTP after success
			}
		});
	}catch(error) {
		console.log("Error Verifying User OTP", error.message)
		return res.status(500).json({message: "Something went wrong. Please try again", success: false})
	}

  	return res.status(200).json({ message: "Account verified successfully", success: true });
};


// post '/api/employees'
export async function newEmployeeReqHandler(req: ModRequest, res: Response) {
	const { employeeData } = req.body;
	const validRoles  = ["CASHIER", "MANAGER", "ADMIN", "OTHERS"];

	if (!employeeData.username || !employeeData.password || !employeeData.role || !employeeData.email) {
		res.status(400).json({message: "Invalid Request", success: false})
		return;
	}

	if (!validRoles.includes(employeeData.role.toUpperCase())){
		res.status(400).json({ success: false, message: "Invalid Request body field: role" });
		return;
	}

	if (req.user.role !== 'ADMIN') {
		res.status(400).json({ success: false, message: "Unauthorized" });
		return;
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
				verified: true,
			},
		});

		if (employeeData.role.toUpperCase() === 'ADMIN') {
			// send OTP
			res.status(201).json({message: "New Admin account created. Please verify your account", success: true})
			return;
		}

		res.status(201).json(newEmployee);
	} catch (error) {
		res.status(500).json({ success: false, message: "Database Error" });
	}
};

export async function firstAdminReqHandler(req: Request, res: Response) {
	const adminExists = await prisma.employee.count({
		where: {
			role: 'ADMIN'
		}
	}) > 0

	if (adminExists) { // at least one admin exists in the db
		res.status(401).json({message: "Invalid Request! A new admin can't be created", success: false})
		return;
	}


	if (!req.body.username?.trim() || !req.body.password?.trim() || !req.body.email?.trim()) {
		res.status(400).json({message: "Invalid Request", success: false})
		return;
	}
	
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);

		const newAdmin = await prisma.employee.create({
			data: {
				username: req.body.username,
				email: req.body.email,
				password: hashedPassword,
				role: 'ADMIN',
				verified: false,
				otp_and_expirationts: generateOtpWithExpiry()
			},
		});
		// send email
		const {password: _nul, otp_and_expirationts: _nul2, ...clearData} = newAdmin;
		res.status(201).json(clearData);
	} catch (error) {
		console.log("Error Creating New Admin", error)
		res.status(500).json({ success: false, message: "Database Error" });
	}
}


export async function confirmExistingAdminReqHandler(_req: Request, res: Response) {
	const adminExists = await prisma.employee.count({
		where: {
			role: 'ADMIN'
		}
	}) > 0;

	res.status(200).json({message: adminExists})
}

async function logLoginAttempt(employeeId: number, status: 'success'|'failure', ipAddress: string, userAgent: string|undefined, failReason?: string) {
	return await prisma.loginLog.create({
		data: {
			employeeId: employeeId,
			status,
			ipAddress,
			deviceInfo: userAgent,
			failReason: failReason ? failReason : null
		}
	})
}

export async function employeeLoginReqHandler(req: Request, res: Response) {
	try {
		const employee = await prisma.employee.findUnique({
			where: { username: req.body.username }
		});
		
		if (!employee) return res.status(401).json({message: "Invalid credentials", success: false})
	
		const {password: hashedPassword, ...clearUserData} = employee
	
		const isMatch = await bcrypt.compare(req.body.password, hashedPassword);
	
		if (!isMatch || (clearUserData.role !== req.body.role.toUpperCase())) {
			console.log(employee.id, isMatch, req.body.role)
			await logLoginAttempt( clearUserData.id, "failure", (req.ip || req.socket.remoteAddress) as string, req.headers['user-agent'], "Invalid credentials")
			return res.status(401).json({ success: false, message: "Invalid credentials"})
		}else if (!clearUserData.verified) {
			await logLoginAttempt( clearUserData.id, "failure", (req.ip || req.socket.remoteAddress) as string, req.headers['user-agent'], "Valid credentials but unverified employee")
			return res.status(401).json({message: "Unverified Employee", success: false})
		}else {
			const accessToken = generateAccessToken(clearUserData)
			await logLoginAttempt( clearUserData.id, "success", (req.ip || req.socket.remoteAddress) as string, req.headers['user-agent'])
			return res.status(200).json({ success: true, message: accessToken });
		}
	}catch(error) {
		console.log("Error Logging User in", error)
		res.status(500).json({ success: false, message: "Database Error" });
	}

}

// handle logout with token blacklisting such that
// each time logout is initiated, one token is added and one or more is removed from the db