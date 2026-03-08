fetch('http://localhost:3000/api/transactions')
    .then(res => res.json())
    .then(data => require('fs').writeFileSync('tx_api_dump.json', JSON.stringify(data, null, 2)));
