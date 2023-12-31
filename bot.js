require("dotenv").config();
const ethers = require("ethers");
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const app = express();
app.use(express.json());

const { PORT } = process.env;

let types = ['uint256', 'address'];

async function sendTelegramMessage(chatId, message) {
  try {
    await bot.sendMessage(chatId, message);
  } catch (e) {
    console.error("Error sending Telegram message:", e.message);
  }
}

app.post('/webhook', async (req, res) => {
  const webhook = req.body;
  for (let i = 0; i < webhook.length; i++) {
    console.log(webhook[i]);
    const block = webhook[i].blockNumber;
    const txHash = webhook[i].transactionHash;
    const data = ethers.utils.defaultAbiCoder.decode(types, webhook[i].logs[0].data);
    const poolAddress = data[1];

    const message = `
      New Liquidity Pool found on Uniswap V3 Detected!
      More info: https://www.dextools.io/app/en/ether/pair-explorer/${poolAddress}
      Powered by IdeTracker
    `;

    // Replace CHAT_ID with the actual chat ID of your Telegram channel or user
    const chatId = process.env.TELEGRAM_CHAT_ID;
    await sendTelegramMessage(chatId, message);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Express server is listening on PORT ${PORT}...`);
});
