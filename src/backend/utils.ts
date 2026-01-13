import jwt from "jsonwebtoken"
import crypto from 'node:crypto';
import { Resend } from 'resend';

export interface NonSensitiveUserData {
  id: number,
  role: string,
  username: string,
  email: string,
}

const privateKey = process.env.PRIVATE_KEY as string

export function generateAccessToken(userDetails: NonSensitiveUserData) {
  return jwt.sign(userDetails, privateKey, { expiresIn: '4hours' });
}

export function generateAccessToken1(userDetails: NonSensitiveUserData) {
  return jwt.sign(userDetails, privateKey, { expiresIn: '4hours' })
}

const resend = new Resend(process.env.RESEND_API_KEY);

function templateGenerator(code: string) {
  return `
    <div style="font-family: Inter, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
      <p style="line-height: 1.5; margin-bottom: 15px;">
          Your Authentication otp code is <strong style="color: blue; font-weight: 600; font-size: 1.5rem;">${code}</strong>
      </p>
      <p style="line-height: 1.5; margin-bottom: 15px;">
          This one time code expires in 15 minutes. Do not share this code with anyone
      </p>
    </div>
  `
}

export async function sendOtpToEmail(email: string, otp: string) {
  const { data, error } = await resend.emails.send({
    from: 'Auth@bizhq.dev',
    to: [email],
    subject: 'Authentication OTP',
    html: templateGenerator(otp)
  });

  if (error) {
    console.error({ error });
    return false
  }

  console.log({ data });
  return true;
}


/**
 * Generates a 6-digit OTP and a timestamp 15 minutes in the future.
 * Returns format: "123456|1700000000000"
 */
export function generateOtpWithExpiry(): string {
  // Generate a random 6-digit number string
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Set expiry to 15 minutes from now (in milliseconds)
  const fifteenMinutes = 15 * 60 * 1000;
  const expiry = Date.now() + fifteenMinutes;

  return `${otp}|${expiry}`;
}