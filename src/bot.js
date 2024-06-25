require('dotenv').config();
const { Client } = require('pg');
const TelegramBot = require('node-telegram-bot-api');

// Telegram bot token
const token = '7276924264:AAFTVX2kKkqU9mh27iRbyu93Y2s0pT4EECI';
const bot = new TelegramBot(token, { polling: true });

// PostgreSQL client setup
const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: 5432, // default PostgreSQL port
  ssl: {
    rejectUnauthorized: false, // For local development without SSL
  }
});
// Command: /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello! I am your friendly bot.');
  });
  
  // Command: /help
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Help!');
  });
  
  // Echo any text message
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text && !msg.text.startsWith('/')) {
      bot.sendMessage(chatId, msg.text);
    }
  });
// Connect to PostgreSQL and listen for notifications
client.connect(err => {
  if (err) {
    console.error('Failed to connect to PostgreSQL:', err.stack);
  } else {
    console.log('Connected to PostgreSQL.');
    client.query('LISTEN new_update');
  }
});

// Handle PostgreSQL notifications
client.on('notification', msg => {
  if (msg.channel === 'new_update') {
    const payload = msg.payload;
    // Here, you can specify the chat_id where the bot should send the message
    const chatIds = [5946547998,6319433009];
    const message = `New update: ${payload}`;

    // Send message to all chat IDs
    chatIds.forEach(chatId => {
      bot.sendMessage(chatId, message).catch(error => {
        console.error(`Failed to send message to ${chatId}: ${error.message}`);
      });
    });
   
  }
});

console.log('Bot is running and listening for PostgreSQL notifications...');
