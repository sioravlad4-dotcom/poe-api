const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Змінюємо кеш-папку на локальну папку проєкту
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
