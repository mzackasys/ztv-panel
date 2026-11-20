// modules/lhu-manual.js
window.ZTV_MODULES = window.ZTV_MODULES || {};
window.ZTV_MODULES.lhuManual = (() => {
  const LHU_MANUAL_URL = 'https://docs.google.com/spreadsheets/d/1EVFtGw6K4wCkc5StBz4sDhtHiPgLn3pU/';

  // Buka spreadsheet LHU Manual di tab baru
  function open() {
    window.open(LHU_MANUAL_URL, '_blank', 'noopener');
  }

  return { open, url: LHU_MANUAL_URL };
})();
