// modules/hide-columns.js
window.ZTV_MODULES = window.ZTV_MODULES || {};

window.ZTV_MODULES.hideColumns = (() => {
  function toggle(columnPrefix, isHide) {
    const tableEl = document.getElementById('tablePrepAnalysis');
    if (!tableEl || !window.jQuery || !jQuery.fn.dataTable) return;

    const dt = jQuery(tableEl).DataTable();
    dt.columns().every(function () {
      const headerText = this.header().innerText.trim().toLowerCase();
      if (headerText.startsWith(columnPrefix.toLowerCase())) {
        this.visible(!isHide);
      }
    });
    dt.columns.adjust().draw(false);
  }

  return { toggle };
})();