import {type CartItem } from "./../Sales"

export async function printReceipt (ip: string, sale: any, businessName: string): void;

export async function kickCashDrawer(ip: string): void;

export async function checkPrinterStatus(ip: string): { online: boolean, message: string };