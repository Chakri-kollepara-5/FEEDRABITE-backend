const fetch = require('node-fetch');

async function testAgent() {
  try {
    const response = await fetch('http://localhost:5000/api/agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surplusData: [] })
    });
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Data:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testAgent();
