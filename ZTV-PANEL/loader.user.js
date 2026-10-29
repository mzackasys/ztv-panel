// ==UserScript==
// @name         Zaki - ZTV Universal Cloud Loader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Universal Loader untuk ZTV Panel Modular dari GitHub
// @author       Zaki
// @match        https://equality.kalbenutritionals.com/*
// @run-at       document-end
// @allFrames    true
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // Ganti USERNAME dan ztv-panel-suite sesuai akun repositori Anda
  const MAIN_ENTRY_URL = 'https://raw.githubusercontent.com/USERNAME/ztv-panel-suite/main/main.js?t=' + Date.now();

  const scriptTag = document.createElement('script');
  scriptTag.src = MAIN_ENTRY_URL;
  scriptTag.type = 'text/javascript';
  document.head.appendChild(scriptTag);
})();