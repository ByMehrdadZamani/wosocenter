# WoSoCenter Analytics v4.1 — ثبت IP و مدل گوشی در نسخه آزمایشی

این نسخه روی بسته v4 قبلی ساخته شده است و امکانات تاریخ و ساعت تهران، نمودار خطی، فیلتر شمسی و ریزرویدادها را حفظ می‌کند؛ دو فیلد جدید `ipAddress` و `deviceModel` را به گزارش ادمین اضافه می‌کند.

## خیلی مهم

- **Worker اصلی `wosocenter-analytics` و دیتابیس اصلی را فعلاً دست نزنید.** Worker جدید فقط `wosocenter-analytics-preview` است.
- برای پرهیز از مخلوط‌شدن اطلاعات، سایت عمومی `/wosocenter/` به Worker اصلی و سایت `/wosocenter-preview/` به Worker آزمایشی وصل می‌شود.
- IP خام فقط از هدر Cloudflare `CF-Connecting-IP` در خود Worker گرفته می‌شود. مقدار IP از مرورگر قبول نمی‌شود. دسترسی به فیلد IP فقط از API محافظت‌شده با نشست مدیر ممکن است.
- مدل گوشی تنها وقتی که مرورگر گزارش دهد یا در User-Agent مدل صریح باشد ثبت می‌شود. امکان تقلب در User-Agent وجود دارد و برای بسیاری از دستگاه‌ها مدل ناشناخته است.
- IP خام تا ۷ روز نگه داشته می‌شود: API حتی در صورت تأخیر پاک‌سازی، IP قدیمی‌تر از ۷ روز را مخفی می‌کند؛ برای پاک‌سازی خودکار از دیتابیس، Cron روزانه حتماً فعال شود.
- داده‌های قبلی IP و مدل ندارند و قابل بازیابی نیستند.
- هیچ تصویری از PNG یا محتوای پوستر کاربران ذخیره نمی‌شود.
- اطلاع‌رسانی صرفاً در تلگرام لزوماً همه بازدیدکنندگان یک وب‌سایت عمومی را پوشش نمی‌دهد. قبل از فعال کردن جمع‌آوری داده‌های شخصی، الزامات مربوط به اطلاع‌رسانی، مبنای قانونی، مدت نگهداری و دسترسی را در حوزه قضایی مرتبط بررسی کنید. توصیه می‌شود در خود سایت هم یک اطلاعیه کوتاه و واضح قرار داده شود.

## فایل‌ها

### WoSoCenter-Worker-v4.1-Preview.zip

- `worker.js`: کد Cloudflare Worker با نسخه `4.1`
- `d1-schema.sql`: ساخت **دیتابیس تازه** با همه جدول‌ها و ستون‌ها
- `d1-upgrade-from-v4.sql`: ارتقای دیتابیس **از قبل ساخته‌شده با نسخه v4**. **فقط یک بار** اجرا شود.

### WoSoCenter-Admin-v4.1-Development.zip

- `admin.html`
- `admin-v3.js`
- `admin-v3.css`
- `woso-analytics.js`

**هر چهار فایل** در ریشه مخزن `wosocenter` و Branch `development` جایگزین شوند. هرگز فایل `worker.js`، SQL یا Secret را در GitHub Pages آپلود نکنید.

## گام ۱ — دیتابیس آزمایشی Cloudflare

در `dash.cloudflare.com` وارد **Storage & databases → D1** شوید:

**اگر هنوز دیتابیس Preview را نساخته‌اید:**

1. دیتابیس `wosocenter-analytics-preview-db` را بسازید.
2. در بخش Console تمام کد `d1-schema.sql` را اجرا کنید.
3. فایل `d1-upgrade-from-v4.sql` را روی این دیتابیس تازه اجرا **نکنید**.

**اگر قبلاً بسته v4 را نصب کرده‌اید و جدول analytics_events وجود دارد:**

1. از دیتابیس Preview بکاپ بگیرید.
2. فقط `d1-upgrade-from-v4.sql` را **یک بار** روی همان دیتابیس Preview اجرا کنید.
3. روی این دیتابیس `d1-schema.sql` جدید را اجرا نکنید، چون هدف آن نصب اولیه است.

## گام ۲ — Worker آزمایشی

1. Cloudflare **Workers & Pages → wosocenter-analytics-preview → Edit code**.
2. محتوای کامل `worker.js` را جایگزین کنید و **Deploy** بزنید.
3. در **Settings → Bindings**، دیتابیس Preview به عنوان `DB` متصل باشد.
4. در **Settings → Variables and Secrets**، این دو Secret وجود داشته باشند: `ADMIN_PASSWORD` (حداقل ۱۲ کاراکتر) و `SESSION_PEPPER` (حداقل ۲۴ کاراکتر). اگر از قبل هستند، عوض نکنید؛ عوض کردن Pepper می‌تواند نشست‌ها و هش نشست قبلی را ناسازگار کند.
5. در **Settings → Triggers → Cron Triggers** برنامه `0 3 * * *` را اضافه کنید. در Cloudflare ساعت Cron معمولاً UTC است و اجرای آن روزانه پاک‌سازی را انجام می‌دهد.
6. آدرس واقعی Worker Preview را از Cloudflare بگیرید و `/health` را باز کنید. انتظار: `version: "4.1"`, `timezone: "Asia/Tehran"`, `status: "ready"`.
7. اگر URL Worker با مقدار پیش‌فرض متفاوت است، در `woso-analytics.js` مقدار URL مربوط به `isPreview` را اصلاح کنید.

**تذکر:** اگر هنوز Worker Preview وجود ندارد، آن را ابتدا ایجاد کنید و `DB` و Secretها را تنظیم کنید.

## گام ۳ — GitHub Development

فایل‌های ZIP فرانت‌اند را استخراج کرده و هر چهار فایل را در ریشه Branch `development` مخزن اصلی آپلود کنید:

https://github.com/ByMehrdadZamani/wosocenter/upload/development

Workflow موجود، فایل‌ها را به `wosocenter-preview` منتقل می‌کند. تا وقتی تغییرات به `main` Merge نشوند، سایت اصلی از کد جدید استفاده نمی‌کند.

## گام ۴ — آزمایش

1. لینک `https://bymehrdadzamani.github.io/wosocenter-preview/lineup.html` را با مرورگری واقعی باز کنید.
2. چند صفحه ببینید و یک دانلود PNG تستی شروع کنید.
3. به `https://bymehrdadzamani.github.io/wosocenter-preview/admin.html` بروید و با **رمز Worker Preview** وارد شوید.
4. در قسمت «رویدادهای بازدیدکنندگان» ستون «IP بازدیدکننده (۷ روز)» و ستون «دستگاه» را ببینید؛ مدل ممکن است نامشخص باشد. برای درخواست بدون هدر `CF-Connecting-IP` نیز مقدار `—` دیده می‌شود.
5. همه داده‌های زمان بر اساس `Asia/Tehran` نمایش داده می‌شوند.

## درباره نگهداری داده‌ها

- رویدادهای جزئی: ۹۰ روز؛ IP خام داخل آن رویدادها: حداکثر ۷ روز **با Cron فعال**.
- رکوردهای تجمیعی برای نمودارهای قدیمی حفظ می‌شوند؛ انتقال به Tehran باعث بازسازی تاریخ Berlin گذشته نمی‌شود.
- درصورت نیاز می‌توانید در Worker متغیر `KEEP_RAW_IP_DAYS` را کوتاه‌تر کنید و مجدداً Deploy کنید.
- برای پاک‌کردن فوری همه IPهای موجود از D1 Preview: `UPDATE analytics_events SET ip_address=NULL;` (این دستور را فقط در صورت تصمیم به حذف داده اجرا کنید).

## انتشار نهایی در آینده

Merge کردن `development` به `main` فقط فرانت‌اند GitHub Pages را منتشر می‌کند؛ خود **Worker اصلی و دیتابیس اصلی به‌طور خودکار ارتقا نمی‌یابند**. اگر پس از بررسی Preview تصمیم به انتشار گرفتید، ابتدا از دیتابیس اصلی بکاپ تهیه کنید، ستون‌های جدید D1 و کد Worker اصلی را با برنامه مهاجرت هماهنگ کنید و سپس PR را Merge کنید. هشدار: در مرحله انتشار نباید Worker Preview را به جای Worker اصلی معرفی کنید.
