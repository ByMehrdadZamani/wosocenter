# WoSoCenter — جدول‌ساز نسخه ۲ (API Ninjas)

این بسته با پاسخ موفق Worker مربوط به Liga F فصل ۲۰۲۶/۲۷ سازگار است. کلید API را در فایل‌های سایت قرار ندهید.

## فایل‌ها
- `standings.html` صفحه جدول‌ساز
- `standings.css` طراحی صفحه
- `standings.js` دریافت داده از Worker و خروجی PNG
- `index.html` صفحه اصلی با کارت چهارم جدول‌ساز (برگرفته از نسخه بررسی‌شده مخزن؛ در صورت تغییر صفحه اصلی خودتان با دقت ادغام کنید)

## نصب روی GitHub Pages
1. از `index.html` فعلی نسخه پشتیبان بگیرید.
2. فایل‌های `standings.html`، `standings.css` و `standings.js` را در ریشه مخزن آپلود کنید.
3. اگر می‌خواهید کارت چهارم در صفحه اصلی ظاهر شود، فایل `index.html` را هم با نسخه فعلی مخزن مقایسه و ادغام کنید.
4. پس از Commit، آدرس https://bymehrdadzamani.github.io/wosocenter/standings.html را باز کنید.
5. روی «دریافت اطلاعات آنلاین» بزنید؛ پس از دریافت موفق ۱۶ تیم، عنوان و رنگ‌بندی را تنظیم و PNG را دانلود کنید.

## نکات
- مسیر Worker: https://wosocenter-standings.mr-mehrdadzamani1382.workers.dev/api/standings?league=ligaf&season=2026
- کلید فقط باید در Cloudflare Secret با نام API_NINJAS_KEY باشد؛ در GitHub یا HTML/JS کپی نشود.
- API Ninjas در پاسخ فعلی لوگو و فرم تیم‌ها را نمی‌دهد. نسخه ۲ نام و مخفف تیم‌ها را نمایش می‌دهد؛ لوگوهای محلی را می‌توان بعداً افزود.
- `updatedAt` زمان دریافت داده توسط Worker است، نه الزاماً آخرین آپدیت مسابقات.
- صفحه فعلاً فقط Liga F را پشتیبانی می‌کند. فصل جاری به‌طور پیش‌فرض انتخاب می‌شود.
- این بسته عمداً روی مخزن یا Worker منتشر نشده است.
