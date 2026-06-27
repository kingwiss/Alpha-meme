const https = require('https');

const fetchTx = () => {
  return new Promise((resolve) => {
    const data = JSON.stringify({
        "publicKey": "G6tTz17rWcXYbU788gq4wLh9eHq2N6i8h18L2zD8gG9B",
        "action": "buy",
        "mint": "7hYEqeCpdJ2oW9jXWqjPzU43n8aH9cRyA94X6y5Qpump",
        "amount": 0.0001,
        "denominatedInSol": true,
        "slippage": 10,
        "priorityFee": 0.0001,
        "pool": "pump"
    });

    const req = https.request('https://pumpportal.fun/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks) }));
    });
    
    req.write(data);
    req.end();
  });
};

fetchTx().then(async res => {
  console.log("status:", res.status);
  console.log("data size:", res.data.length);
  if (res.status !== 200) {
     console.log(res.data.toString());
  }
});
