const fs = require('fs');
const data = JSON.parse(fs.readFileSync('tx_dump2.json', 'utf8'));
const hidden = data.filter(tx => tx.userId === 'pareja' && !tx.paidBy);
console.log('Hidden transactions count:', hidden.length);
console.log('Total hidden amount:', hidden.reduce((sum, tx) => sum + tx.amountCents, 0));
const marchHidden = hidden.filter(tx => tx.date.startsWith('2026-03'));
console.log('March hidden transactions count:', marchHidden.length);
console.log('Total march hidden amount:', marchHidden.reduce((sum, tx) => sum + tx.amountCents, 0));
