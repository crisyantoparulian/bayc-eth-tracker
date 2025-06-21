// fetchAndBalance.js
const axios = require('axios');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');
const { parse } = require('csv-parse/sync');
const { COVALENT_API_KEY, BAYC_CONTRACT, ETHERSCAN_API_KEY } = require('./config');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllHolders(blockHeight, csvPath) {
  let allAddresses = new Set();
  let page = 0;
  let hasMore = true;

  console.log('Fetching BAYC token holders...');

  while (hasMore) {
    const url = `https://api.covalenthq.com/v1/1/tokens/${BAYC_CONTRACT}/token_holders/?block-height=${blockHeight}&page-number=${page}&page-size=10000&key=${COVALENT_API_KEY}`;
    const res = await axios.get(url);
    const items = res.data.data.items;

    for (const item of items) {
      allAddresses.add(item.address.toLowerCase());
    }

    hasMore = res.data.data.pagination.has_more;
    page++;
    console.log(`Fetched page ${page}, total holders: ${allAddresses.size}`);
  }

  const csvData = Array.from(allAddresses).map(address => ({ Address: address, ETH: '' }));
  const csvString = stringify(csvData, { header: true });
  fs.writeFileSync(csvPath, csvString);
  console.log(`✅ Saved ${allAddresses.size} holders to ${csvPath}`);
  return csvData;
}

async function getEthBalance(address, blockHeight, retry = 0) {
  const url = `https://api.covalenthq.com/v1/1/address/${address}/balances_v2/?block-height=${blockHeight}&key=${COVALENT_API_KEY}`;

  try {
    const res = await axios.get(url);
    const items = res.data.data.items;
    const eth = items.find(item =>
      item.contract_address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    );

    const balance = eth ? parseFloat(eth.balance) / 1e18 : 0;
    return balance;
  } catch (err) {
    if (err.response?.status === 429 && retry < 5) {
      const wait = (retry + 1) * 1500;
      console.warn(`429 Too Many Requests for ${address}. Retrying in ${wait}ms...`);
      await delay(wait);
      return getEthBalance(address, blockHeight, retry + 1);
    }

    console.warn(`❌ Failed to get balance for ${address}: ${err.message}`);
    return 0;
  }
}

async function getBlockFromTimestamp(timestamp) {
  const url = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${ETHERSCAN_API_KEY}`;
  const res = await axios.get(url);
  if (res.data.status === '1') {
    return parseInt(res.data.result);
  } else {
    throw new Error(`Etherscan error: ${res.data.message}`);
  }
}

module.exports = { fetchAllHolders, getEthBalance, getBlockFromTimestamp };
