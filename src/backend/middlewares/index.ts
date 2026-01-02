import type {Response, Request} from "express";
import jwt from "jsonwebtoken"
import "dotenv/config";

interface NonSensitiveUserData {
	id: number,
	role: string,
	username: string,
	email: string,
}

export interface ModRequest extends Request {
	user: NonSensitiveUserData;
}


const privateKey = process.env.PRIVATE_KEY as string

export function generateAccessToken(userDetails: NonSensitiveUserData) {
  return jwt.sign(userDetails, privateKey, { expiresIn: '4hours' });
}

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
	/*const excludedEndpoints = ["/login", "/signup", "/new-event"];
	if (excludedEndpoints.includes(req.originalUrl)) {
		next()
		return; // implement logic such that only some roles can access some endpoints
	}*/
	console.log()
	let accessToken = ""
	const authorizationHeaderVal = req.headers["authorization"]
	if (authorizationHeaderVal){
		const components = authorizationHeaderVal.split(" ")
		if (components.length !== 2) {
			res.status(401).json({ errorMsg: 'Unauthorized Request!', msg: null, data: null});
			return;
		}else {
			accessToken = components[1]
		}
	}else {
		res.status(401).json({ errorMsg: 'Unauthorized Request!', msg: null, data: null});
		return;
	}

	try {
	    // Verify token
	    const payload = jwt.verify(accessToken, privateKey) as any;
		req.user = {id: payload.id, role: payload.role, username: payload.username, email: payload.email}
	    next()
	} catch (err) {
	    if (err.name === 'TokenExpiredError') {
	      return res.status(401).json({ errorMsg: 'Token expired', msg: null, data: null });
	    }
	    return res.status(403).json({ errorMsg: 'Invalid token', msg: null, data: null });
  }
}