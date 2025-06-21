# 🐵 BAYC ETH Balance Tracker

A Node.js CLI app to calculate the **total ETH balance** held by all holders of **Bored Ape Yacht Club (BAYC)** NFTs on Ethereum at any given point in time (based on an epoch timestamp).

---

## 🚀 Features

- 🔢 Convert timestamp to Ethereum block height using **Etherscan**
- 📦 Fetch BAYC token holders at a specific block using **CovalentHQ**
- 💰 Fetch each wallet’s ETH balance at that block
- 💾 Save all data to a CSV file (resumable)
- 🧠 Cache total ETH per timestamp in SQLite
- ⚙️ Rate-limited requests (max 5/sec) using `p-queue`
- 🔁 Auto-retry on 429 Too Many Requests

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/bayc-eth-tracker.git
cd bayc-eth-tracker
npm install
touch .env