/* WoSoCenter Lineup performance bridge v1.0.
 * Uses images already requested by the early bootloader. No rendering geometry changes.
 */
(() => {
  'use strict';
  const boot = window.__wosoLineupBoot;
  if (!boot || typeof lImage !== 'function' || typeof lRender !== 'function') return;

  const originalImage = lImage;
  lImage = function (src) {
    if (!src) return null;
    const cached = lImgCache.get(src);
    if (cached) return cached.image;

    // Reuse the exact decoded Image object, not just the browser's HTTP cache.
    const early = boot.images.get(src);
    if (early) {
      const loaded = early.complete && early.naturalWidth > 0;
      const record = { image: early, loaded, error: early.complete && !loaded };
      lImgCache.set(src, record);
      if (!early.complete) {
        early.addEventListener('load', () => {
          record.loaded = true;
          lRender();
        }, { once: true });
        early.addEventListener('error', () => {
          record.error = true;
          lRender();
        }, { once: true });
      }
      return early;
    }

    const image = originalImage(src);
    // In the original engine, a 404 on a calibrated image marks it as failed
    // without scheduling another frame. Without this, the source-image fallback
    // is never drawn until the next user interaction.
    if (image && !image.__wosoSpeedErrorHook) {
      image.__wosoSpeedErrorHook = true;
      image.addEventListener('error', () => lRender(), { once: true });
    }
    return image;
  };
})();
