import { test, chromium } from '@playwright/test';

test('open google with iPhone user agent', async () => {
  // تنظیمات مرورگر با User Agent آیفون
  const browser = await chromium.launch({
    headless: false, // برای نمایش مرورگر
    slowMo: 50 // کمی مکث بین عملیات‌ها
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 }, // ابعاد آیفون 13
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  
  // غیرفعال کردن WebDriver
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7'
  });

  try {
    await page.goto('https://www.google.com');
    
    // منتظر می‌مانیم تا کاربر به صورت دستی کارش را انجام دهد
    await new Promise(() => {}); // این خط باعث می‌شود مرورگر باز بماند
    
  } catch (error) {
    console.error('خطا در اجرای اسکریپت:', error);
  }
});