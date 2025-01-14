const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const TELEGRAM_API_URL = 'https://api.telegram.org/bot7940815082:AAHVHb0LllpLGMl7cxqv5x_Ayp0AkyYSgDU';
const WEB_APP_URL = 'https://your-web-app-url.app/';

app.post('/api/bot', async (req, res) => {
    const message = req.body.message;
    if (message && message.text === "/start") {
        const responseText = '*Welcome to Your Amazing Bot!* \nGet ready to explore our bot!';
        try {
            const inlineKeyboardMarkup = {
                inline_keyboard: [[{ text: "Start Now!", web_app: { url: ${WEB_APP_URL}?startapp=fullscreen } }]]
            };
            await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
                chat_id: message.chat.id,
                text: responseText,
                parse_mode: 'Markdown',
                reply_markup: JSON.stringify(inlineKeyboardMarkup)
            });
            res.status(200).send('Command processed');
        } catch (error) {
            res.status(500).send('Error processing command');
        }
    } else {
        res.status(200).send('No command processed');
    }
});

module.exports = app;