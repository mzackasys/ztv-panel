// modules/show-1000.js
window.ZTV_MODULES = window.ZTV_MODULES || {};

window.ZTV_MODULES.show1000 = (() => {
  function apply(targetLength) {
    const lengthSelects = document.querySelectorAll('select[name$="_length"]');
    if (!lengthSelects.length) return;

    lengthSelects.forEach(select => {
      if (!select.querySelector(`option[value="${targetLength}"]`)) {
        const opt = document.createElement('option');
        opt.value = targetLength.toString();
        opt.text = targetLength.toString();
        select.appendChild(opt);
      }

      if (select.value !== targetLength.toString()) {
        select.value = targetLength.toString();
      }

      const tableId = select.getAttribute('aria-controls') || select.name.replace('_length', '');
      const tableEl = document.getElementById(tableId);

      if (tableEl && window.jQuery && jQuery.fn.dataTable) {
        try {
          const dt = jQuery(tableEl).DataTable();
          if (dt.page.len() !== targetLength) {
            dt.page.len(targetLength).draw(false);
          }
        } catch (e) {
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const scrollBody = tableEl.closest('.dataTables_scrollBody');
        if (scrollBody) {
          if (targetLength >= 1000) {
            scrollBody.style.setProperty('max-height', 'none', 'important');
            scrollBody.style.setProperty('height', 'auto', 'important');
            scrollBody.style.setProperty('overflow-y', 'visible', 'important');
          } else {
            scrollBody.style.removeProperty('max-height');
            scrollBody.style.removeProperty('height');
            scrollBody.style.removeProperty('overflow-y');
          }
        }
      }
    });
  }

  return { apply };
})();