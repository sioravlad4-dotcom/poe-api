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

        // Блокуємо все зайве для швидкості
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        console.log('🌐 Перехід на сайт...');
        // Використовуємо 'networkidle2' — це означає "чекати, поки залишиться не більше 2 активних запитів"
        // Це набагато швидше, ніж чекати повного завантаження
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
    }
});
