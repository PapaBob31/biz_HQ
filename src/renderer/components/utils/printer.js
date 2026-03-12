
function createRequest(sale, businessName) {
    var builder = new StarWebPrintBuilder();

    var request = '';

    request += builder.createInitializationElement();
    request += builder.createTextElement({characterspace:2});

    request += builder.createAlignmentElement({position:'center'});
    request += builder.createTextElement({data: businessName} + '\n');

    const dateStr = new Date(sale.createdAt).toLocaleString();
    request += builder.createAlignmentElement({position:'center'});
    request += builder.createTextElement({data: dateStr + '\n'});

    request += builder.createAlignmentElement({position:'left'});

    request += builder.createTextElement({data:'\n'});
    request += builder.createTextElement({data:'-----------------------------------------\n'});
    request += builder.createTextElement({data:'\n'});
    for (const item of sale.items) {
        request += builder.createTextElement({data:(`${item.name} x${item.quantity}`).padEnd(25) + `$${(item.price * item.quantity).toFixed(2)}\n`})
    }
    request += builder.createTextElement({data:'\n'});
    request += builder.createTextElement({data:'-----------------------------------------\n'});
    request += builder.createTextElement({data:'\n'});

    request += builder.createTextElement({data:`Subtotal                 $${sale.subTotal.toFixed(2)}\n`, emphasis:true});
    request += builder.createTextElement({data:`Tax                   $${sale.tax}%\n`, emphasis:true});
    request += builder.createTextElement({data:`Total                   $${sale.total}\n`, emphasis:true, width: 2, height: 2});

    request += builder.createAlignmentElement({position:'center'});
    request += builder.createTextElement({data:'Thank you for your coming. \n'});
    request += builder.createTextElement({data:"We hope you'll visit again.\n"});

    request += builder.createTextElement({width:1});
    request += builder.createTextElement({data:'\n'});

    request += builder.createTextElement({characterspace:0});
    request += builder.createCutPaperElement({feed:true});

    return request
}

function sendMessageApi(request, url) {

    var trader = new StarWebPrintTrader({url:url});

    trader.onReceive = function (response) {
        // trigger a toast that receipt printed
    }

    trader.onError = function (response) {
        var msg = '- Unexpected Error while trying to print or open drawer -\n\n';

        msg += '\tStatus:' + response.status + '\n';

        msg += '\tResponseText:' + response.responseText;

        alert(msg);
    }

    trader.sendMessage({request:request});
}


export async function printReceipt (printerIp, sale, businessName) {
    const request = createRequest(sale, businessName)
    sendMessageApi(request, `https://${printerIp}/StarWebPRNT/SendMessage`)
};

export async function kickCashDrawer(printerIp) {
    var builder = new StarWebPrintBuilder();

    var request = builder.createPeripheralElement({channel:1, on:200, off:200});

    sendMessageApi(request, `https://${printerIp}/StarWebPRNT/SendMessage`)
};


/**
 * Pings the printer to check if it's reachable and returns its current status.
 */
export const checkPrinterStatus = async (ip) => {
  if (!ip) return { online: false, message: "No IP provided" };

  try {
    // StarWebPRNT expects a POST to this specific endpoint
    const response = await fetch(`https://${ip}/StarWebPRNT/SendMessage`, {
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
