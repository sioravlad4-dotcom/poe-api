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
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });

        const page = await browser.newPage();
        
        // Маскуємося під звичайний браузер на Windows
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 720 });

        // ПРИСКОРЕННЯ: Блокуємо картинки, шрифти та стилі
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        console.log('🌐 Перехід на сайт обленерго...');
        try {
            await page.goto(`https://www.poe.pl.ua/disconnection/power-outages/?nocache=${Date.now()}`, { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 // Чекаємо 30 сек на саму сторінку
            });
        } catch (e) {
            console.log('⚠️ Таймаут переходу, але продовжуємо (можливо, завис якийсь трекер)...');
        }

        // ШПИГУН: Дивимося, як називається сторінка
        const pageTitle = await page.title();
        console.log('👀 Заголовок сторінки: ' + pageTitle);

        console.log('⏳ Очікування завантаження таблиці...');
        // Чекаємо саме на нашу таблицю (максимум 15 сек)
        await page.waitForSelector('.gpvinfodetail', { timeout: 15000 });

        console.log('✅ Таблиця знайдена! Відправляємо дані...');
        const html = await page.content();
        res.send(html);

    } catch (error) {
        console.error('❌ Помилка:', error.message);
        
        // Якщо помилка, друкуємо HTML, щоб побачити, чи це Cloudflare
        if (browser) {
            try {
                const pages = await browser.pages();
                if (pages.length > 0) {
                    const html = await pages[0].content();
                    console.log('📄 Що побачив браузер (перші 500 символів):', html.substring(0, 500));
                }
            } catch (e) {}
        }
        
        res.status(500).send('Помилка: ' + error.message);
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
