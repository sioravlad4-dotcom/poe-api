const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

app.get('/get-schedule', async (req, res) => {
    let browser;
    try {
        console.log('🚀 Запуск браузера...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Блокуємо все зайве для максимальної швидкості
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        console.log('🌐 Перехід на сайт...');
        // Чекаємо, поки з'явиться хоча б щось (networkidle2)
        await page.goto(`https://www.poe.pl.ua/disconnection/power-outages/`, { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        console.log('⏳ Шукаємо таблицю...');
        // Чекаємо саме на селектор таблиці
        await page.waitForSelector('.gpvinfodetail', { timeout: 20000 });

        console.log('✅ Таблиця є!');
        const html = await page.content();
        res.send(html);

    } catch (error) {
        console.error('❌ Помилка:', error.message);
        res.status(500).send('Error: ' + error.message);
    } finally {
        if (browser) await browser.close();
        console.log('🛑 Браузер закрито.');
    }
});

app.listen(port, () => {
    console.log(`⚡ Сервер працює на порту ${port}`);
});
