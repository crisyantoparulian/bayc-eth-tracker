// app.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const PQueue = require('p-queue').default;
const { parse, stringify } = require('csv-parse/sync');
const { fetchAllHolders, getEthBalance, getBlockFromTimestamp } = require('./fetch');
const { getTotalFromCache, saveCachedTotal } = require('./db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Limit to 5 requests per second
const queue = new PQueue({ interval: 1000, intervalCap: 5 });

(async () => {
  try {
    const inputEpoch = await ask('Enter epoch timestamp: ');
    const timestamp = parseInt(inputEpoch.trim(), 10);
    rl.close();

    if (isNaN(timestamp)) {
      console.error('❌ Invalid epoch timestamp.');
      process.exit(1);
    }

    const csvPath = path.join(__dirname, `holders-${timestamp}.csv`);

    // Check total ETH cache first
    const cachedTotal = await getTotalFromCache(timestamp);
    if (cachedTotal !== null) {
      console.log(`✅ Cached total ETH for timestamp ${timestamp}: ${cachedTotal.toFixed(6)} ETH`);
      process.exit(0);
    }

    // Convert epoch to block
    const blockHeight = await getBlockFromTimestamp(timestamp);
    console.log(`📦 Block height for ${timestamp}: ${blockHeight}`);

    let csvData;

    // Load or fetch holder data
    if (fs.existsSync(csvPath)) {
      const raw = fs.readFileSync(csvPath);
      csvData = parse(raw, {
        columns: true,
        skip_empty_lines: true
      });
      console.log(`🔁 Loaded ${csvData.length} holders from ${csvPath}`);
    } else {
      csvData = await fetchAllHolders(blockHeight, csvPath);
    }

    let updated = false;
    let totalEth = 0;

    const promises = csvData.map((row, index) => {
      if (row.ETH === '') {
        return queue.add(async () => {
          const balance = await getEthBalance(row.Address, blockHeight);
          csvData[index].ETH = balance.toFixed(4);
          console.log(`${row.Address} has ${balance.toFixed(4)} ETH`);
          updated = true;
        });
      } else {
        totalEth += parseFloat(row.ETH);
        return null;
      }
    });

    await Promise.all(promises);

    // Recalculate total ETH after all balances are resolved
    totalEth = csvData.reduce((sum, r) => sum + parseFloat(r.ETH || 0), 0);

    if (updated) {
      const updatedCSV = stringify(csvData, { header: true });
      fs.writeFileSync(csvPath, updatedCSV);
      console.log(`💾 Updated balances saved to ${csvPath}`);
    }

    await saveCachedTotal(timestamp, totalEth);
    console.log(`\n💰 Total ETH held by BAYC holders at ${timestamp} (block ${blockHeight}): ${totalEth.toFixed(6)} ETH`);

  } catch (err) {
    console.error('❌ Error:', err);
    rl.close();
    process.exit(1);
  }
})();
