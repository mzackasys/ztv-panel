// ==UserScript==
// @name         Zaki - ZTV Universal Cloud Loader
// @namespace    http://tampermonkey.net/
// @version      1.2
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
          // Bersihkan BOM jika ada
          const cleanCode = response.responseText.replace(/^\uFEFF/, '');
          
          const scriptBlob = new Blob([cleanCode], { type: 'text/javascript' });
          const blobUrl = URL.createObjectURL(scriptBlob);
          const scriptTag = document.createElement('script');
          scriptTag.src = blobUrl;
          scriptTag.onload = () => {
            URL.revokeObjectURL(blobUrl);
            scriptTag.remove();
            console.log('%c[ZTV Loader] ✅ main.js berhasil dieksekusi via Blob!', 'color: #198754; font-weight: bold;');
          };
          (document.head || document.documentElement).appendChild(scriptTag);
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