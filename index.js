const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Вмикаємо режим "невидимки", щоб Cloudflare думав, що ми звичайна людина
puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

app.get('/get-schedule', async (req, res) => {
    let browser;
    try {
        console.log('🚀 Запуск браузера...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Обов'язково для серверів Render
        });

        const page = await browser.newPage();
        
        console.log('🌐 Перехід на сайт обленерго...');
        // Додаємо випадковий параметр, щоб уникнути кешу
        await page.goto(`https://www.poe.pl.ua/disconnection/power-outages/?nocache=${Date.now()}`, { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 
        });

        console.log('⏳ Очікування завантаження таблиці...');
        // Чекаємо, поки скрипт обленерго намалює таблицю (максимум 15 секунд)
        await page.waitForSelector('.gpvinfodetail', { timeout: 15000 });

        console.log('✅ Таблиця знайдена! Копіюємо код...');
        const html = await page.content();
        
        // Відправляємо чистий HTML код
        res.send(html);

    } catch (error) {
        console.error('❌ Помилка:', error.message);
        res.status(500).send('Помилка при отриманні даних: ' + error.message);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🛑 Браузер закрито.');
        }
    }
});

app.listen(port, () => {
    console.log(`⚡ Сервер працює на порту ${port}`);
});
