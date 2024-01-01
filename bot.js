require("dotenv").config();
const ethers = require("ethers");
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: true,
});
const app = express();
app.use(express.json());

const {
    PORT
} = process.env;

let types = ["uint256", "address"];
const subscribedChatIds = new Set();

async function sendTelegramMessage(chatId, message) {
    try {
        await bot.sendMessage(chatId, message);
    } catch (e) {
        console.error("Error sending Telegram message:", e.message);
    }
}

app.get('/', (req, res) => {
    res.send("Uniswap V3 API Bot Is Running")
});

bot.onText(/\/subscribe/, (msg) => {
    const chatId = msg.chat.id;

    if (!subscribedChatIds.has(chatId)) {
        subscribedChatIds.add(chatId);
        bot.sendMessage(chatId, "You have subscribed to receive notifications.");
    } else {
        bot.sendMessage(chatId, "You are already subscribed.")
    }
});

// New command to check subscription status
bot.onText(/\/check_subscription/, (msg) => {
    const chatId = msg.chat.id;

    if (subscribedChatIds.has(chatId)) {
        bot.sendMessage(chatId, "You are currently subscribed.");
    } else {
        bot.sendMessage(chatId, "You are not subscribed. Use /subscribe to subscribe.");
    }
});


app.post("/webhook", async (req, res) => {
    const webhook = req.body;
    for (let i = 0; i < webhook.length; i++) {
        console.log(webhook[i]);
        const block = webhook[i].blockNumber;
        const txHash = webhook[i].transactionHash;
        const data = ethers.utils.defaultAbiCoder.decode(
            types,
            webhook[i].logs[0].data
        );
        const poolAddress = data[1];

        const message = `
New Liquidity Pool found on Uniswap V3 Detected!
More info: https://dexscreener.com/ethereum/${poolAddress}
Powered by Demeter-Labs
`;

/*
        // Replace CHAT_ID with the actual chat ID of your Telegram channel or user
        const chatId = process.env.TELEGRAM_CHAT_ID;
        await sendTelegramMessage(chatId, message);
*/

         // Send messages to all subscribed chat IDs
         for (const chatId of subscribedChatIds) {
            await sendTelegramMessage(chatId, message);
        }
    }

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Express server is listening on PORT ${PORT}...`);
});