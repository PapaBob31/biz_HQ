import {type CartItem } from "./../Sales"

export async function printReceipt (printerIp: string, sale: any, businessName: string) {
  
  const dateStr = new Date(sale.createdAt).toLocaleString();

  /**
   * <text>${storeAddress}\n</text>
      <text>${storePhone}\n\n</text>
   */

  // Generate Item Lines
  const itemLines = sale.items.map((item: CartItem) => 
    `<text>${item.name.padEnd(20)} x${item.quantity}  $${(item.price * item.quantity).toFixed(2)}\n</text>`
  ).join('');

	  		
  const xml = `
<root>
  <StarWebPrint
    xmlns="http://www.star-m.jp"
    xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <Request>
        <InitializePrint />
        <alignment position="center" />
        <text font="emphasized" width="2" height="2">${businessName}\n</text>
        
        <alignment position="left" />
        <text>Date: ${dateStr}\n</text>
        <text>Order ID: #${sale.id.toString().padStart(4, "0")}\n</text>
        <text>Cashier: ${sale.employeeName}\n</text>
        <text>--------------------------------\n</text>
        
        ${itemLines}
        
        <text>--------------------------------\n</text>
        <alignment position="right" />
        <text>Subtotal: $${sale.subTotal.toFixed(2)}\n</text>
        <text>Tax (7.5%): $${sale.tax.toFixed(2)}\n</text>
        <text font="emphasized" width="1" height="2">TOTAL: $${sale.total.toFixed(2)}\n</text>
        
        <alignment position="center" />
        <text>\nThank you for shopping!\n</text>
        <text>Please keep your receipt for returns.\n\n</text>
        
        <cut type="partial" />
      </Request>
    </StarWebPrint>
  </root>
  `;

  return fetch(`http://${printerIp}/StarWebPRNT/SendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', 'charset': 'UTF-8' },
    body: xml
  });
};

export async function kickCashDrawer(printerIp: string) {
  const xml = `
  <root>
    <StarWebPrint
      xmlns="http://www.star-m.jp"
      xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
        <Request>
          <peripheral channel="1" ontime="200" offtime="200" />
        </Request>
    </StarWebPrint>
  </root>
  `;
  try {
    const response = await fetch(`http://${printerIp}/StarWebPRNT/SendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml
    });
    return response
  } catch (e) {
    alert("Hardware Error: Could not reach printer for drawer kick.");
  }
  return null
};


/**
 * Pings the printer to check if it's reachable and returns its current status.
 */
export const checkPrinterStatus = async (ip: string) => {
  if (!ip) return { online: false, message: "No IP provided" };

  try {
    // StarWebPRNT expects a POST to this specific endpoint
    const response = await fetch(`http://${ip}/StarWebPRNT/SendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: '<root></root>' // An empty root often triggers a status response
    });

    if (response.ok) {
      return { online: true, message: "Printer Online" };
    }
    return { online: false, message: `Error: ${response.status}` };
  } catch (error) {
    return { online: false, message: "Printer Offline / Network Error" };
  }
};
