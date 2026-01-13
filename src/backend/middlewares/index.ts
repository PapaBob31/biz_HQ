import type {Response, Request} from "express";
import jwt from "jsonwebtoken"
import "dotenv/config";
import { generateAccessToken, type NonSensitiveUserData } from "../utils";

export interface ModRequest extends Request {
	user: NonSensitiveUserData;
}

const privateKey = process.env.PRIVATE_KEY as string

export async function smartRefreshMiddleware(req: ModRequest, res: Response, next: ()=>void) {
	const authHeader = req.headers.authorization;
	if (!authHeader) return next()

	const token = authHeader.split(' ')[1];

	try {
		const decoded = jwt.verify(token, privateKey) as any;
		
		const currentTime = Math.floor(Date.now() / 1000);
		const oneHourInSeconds = 3600;

		// Check if we are in the "Grace Period" (last hour of validity)
		if (decoded.exp - currentTime < oneHourInSeconds) {
			const newToken = generateAccessToken({id: decoded.id, role: decoded.role, username: decoded.username, email: decoded.email})
			res.setHeader('X-New-Access-Token', newToken);
		}

		req.user = decoded;
		next();
	} catch (err) {
		res.status(401).send("Session Expired");
	}
};


export async function setCorsHeaders(req: Request, res: Response, next: ()=>any) {
	res.set("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN)
	res.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	res.set("Access-Control-Max-Age", "86400");	// 24 hours, should change later
	res.set("Access-Control-Allow-Credentials", "true");
	res.set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, DELETE, PUT");
	if (req.method === "OPTIONS") {
		res.status(204).send()
	}else next()
}

export async function authenticateRequest(req: ModRequest, res: Response, next: ()=> any) {
	const authFreeEndPoints  = ["/api/employees/verify-otp","/api/employees/login", "/api/employees/new-otp" ]
	if (authFreeEndPoints.includes(req.originalUrl)){
		next()
		return; // implement logic such that only some roles can access some endpoints
	}

	if (req.originalUrl === "/api/employees/admin" && req.method === "POST"){
		next();
		return;
	}

	let accessToken = ""
	const authorizationHeaderVal = req.headers["authorization"]
	if (authorizationHeaderVal){
		const components = authorizationHeaderVal.split(" ")
		if (components.length !== 2) {
			res.status(401).json({ message: 'Unauthorized Request!', msg: null, success: false});
			return;
		}else {
			accessToken = components[1]
		}
	}else {
		res.status(401).json({ message: 'Unauthorized Request!', msg: null, success: false});
		return;
	}

	try {
	    // Verify token
	    const payload = jwt.verify(accessToken, privateKey) as any;
		req.user = {id: payload.id, role: payload.role, username: payload.username, email: payload.email}
	    next()
	} catch (err) {
	    if (err.name === 'TokenExpiredError') {
	      return res.status(401).json({ message: 'Token expired', msg: null, success: false });
	    }
	    return res.status(401).json({ message: 'Invalid token', msg: null, success: false });
  }
}