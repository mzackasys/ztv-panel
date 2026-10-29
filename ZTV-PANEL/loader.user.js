// ==UserScript==
// @name         Zaki - ZTV Universal Cloud Loader
// @namespace    http://tampermonkey.net/
// @version      1.1
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
          // Eksekusi kode main.js langsung di environment halaman
          const runScript = new Function(response.responseText);
          runScript();
          console.log('%c[ZTV Loader] ✅ main.js berhasil dieksekusi!', 'color: #198754; font-weight: bold;');
        } catch (err) {
          console.error('[ZTV Loader] ❌ Error saat mengeksekusi main.js:', err);
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