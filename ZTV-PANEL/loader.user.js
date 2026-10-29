// ==UserScript==
// @name         Zaki - ZTV Universal Cloud Loader
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Universal Loader untuk ZTV Panel Modular dari GitHub
// @author       Zaki
// @match        https://equality.kalbenutritionals.com/*
// @run-at       document-end
// @allFrames    true
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
  'use strict';

  const MAIN_ENTRY_URL = 'https://raw.githubusercontent.com/mzackasys/ztv-panel/main/ZTV-PANEL/main.js?t=' + Date.now();

  console.log('[ZTV Loader] Mengunduh skrip utama dari GitHub...');

  GM_xmlhttpRequest({
    method: "GET",
    url: MAIN_ENTRY_URL,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    },
    onload: function(response) {
      if (response.status === 200 && response.responseText.trim().length > 0) {
        try {
          // Bersihkan karakter BOM (\uFEFF) & spasi non-breaking (\u00A0) yang memicu SyntaxError
          const sanitizedCode = response.responseText
            .replace(/^\uFEFF/, '')
            .replace(/\u00A0/g, ' ');

          // Eksekusi murni via inline script (diizinkan oleh CSP 'unsafe-inline')
          const scriptTag = document.createElement('script');
          scriptTag.textContent = sanitizedCode;
          (document.head || document.documentElement).appendChild(scriptTag);
          scriptTag.remove();

          console.log('%c[ZTV Loader] ✅ main.js berhasil dieksekusi secara inline!', 'color: #198754; font-weight: bold;');
        } catch (err) {
          console.error('[ZTV Loader] ❌ Error saat menyuntikkan main.js:', err);
        }
      } else {
        console.error('[ZTV Loader] ❌ Gagal mengunduh main.js. Status Code:', response.status);
      }
    },
    onerror: function(err) {
      console.error('[ZTV Loader] ❌ Koneksi ke GitHub gagal:', err);
    }
  });
})();