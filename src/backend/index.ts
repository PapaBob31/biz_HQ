import { setCorsHeaders, authenticateRequest, smartRefreshMiddleware } from "./middlewares/index.js"
import { router } from "./routes/index.js"
import express from "express";

function logger(req: Request, _res: Response, next: ()=>void){
	if (process.env.ENVIRONMENT && process.env.ENVIRONMENT !== "test") {
		console.log((new Date()).toDateString(), req.method, req.path)
	}
	next()
}


const server = express()
server.use(logger)
server.use(setCorsHeaders)
server.use(express.json())
server.use(authenticateRequest)
server.use(smartRefreshMiddleware)
server.use(router)

// server.use((req, res, next) => {
//   if (req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
// 	next();
//   } else {
// 	res.status(403).send('Forbidden');
//   }
// })
  
export default server;
