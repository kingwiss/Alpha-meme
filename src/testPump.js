const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://frontend-api.pump.fun/coins/latest');
  const data = await res.text();
  console.log(data.substring(0, 500));
}

test();
