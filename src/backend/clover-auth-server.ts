import type {Response, Request} from "express";

import express from "express";
import axios from "axios";
import cors from "cors"
// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
const app = express();

app.use(cors());

const CLOVER_APP_ID = '3MXXZJD477QWG';
const CLOVER_APP_SECRET = '75f6f786-8a0b-db3d-ddaa-a4efce2c6a58';
const REDIRECT_URI = 'http://localhost:4999/callback';
const CLOVER_BASE_URL = 'https://sandbox.dev.clover.com'; // Change to 'https://www.clover.com' for production

let latestStatus = { authorized: false, token: null, merchantId: null };

// Endpoint to start the flow
app.get('/auth-start', (req: Request, res: Response) => {
  const { merchantId } = req.query;
  const authUrl = `${CLOVER_BASE_URL}/oauth/authorize?client_id=${CLOVER_APP_ID}&redirect_uri=${REDIRECT_URI}&merchant_id=${merchantId}`;
  res.redirect(authUrl);
});

// The actual Redirect URI Clover hits
app.get('/callback', async (req: Request, res: Response) => {
  const { code, merchant_id } = req.query;
  console.log("BRIDGE SERVER", code, merchant_id)

  try {
    // Exchange Code for Access Token
    const tokenRes = await axios.get(`${CLOVER_BASE_URL}/oauth/token`, {
      params: {
        client_id: CLOVER_APP_ID,
        client_secret: CLOVER_APP_SECRET,
        code: code
      }
    });

    latestStatus = { authorized: true, token: tokenRes.data.access_token, merchantId: merchant_id };
    
    // Redirect user to a "Success" page or close window
    res.send('<h1>Authorization Successful! You can close this window.</h1><script>setTimeout(window.close, 2000)</script>');
  } catch (err) {
    res.status(500).send('Authentication Failed');
  }
});

// Endpoint for the React app to poll for status
app.get('/status', (req: Request, res: Response) => {
  res.json(latestStatus);
});

export default app;