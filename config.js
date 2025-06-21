// config.js
require('dotenv').config();
const path = require('path');

module.exports = {
  COVALENT_API_KEY: process.env.COVALENT_API_KEY,
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  BAYC_CONTRACT: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
  DB_PATH: path.join(__dirname, 'bayc_cache.sqlite')
};