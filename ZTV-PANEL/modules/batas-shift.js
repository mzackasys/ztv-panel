// modules/batas-shift.js
window.ZTV_MODULES = window.ZTV_MODULES || {};

window.ZTV_MODULES.batasShift = (() => {
  let thresholdNoAnalisa = null;
  const colorShift1 = '#fff3cd';
  const colorShift2 = '#cfe2ff';

  function scanThresholdEndNS() {
    const prepTableEl = document.getElementById('tablePrepAnalysis');
    if (!prepTableEl || !window.jQuery || !jQuery.fn.dataTable) return null;

    const dtPrep = jQuery(prepTableEl).DataTable();
    let foundThreshold = null;

    dtPrep.rows().every(function () {
      const rowNode = this.node();
      const rowData = this.data();
      let hasEndNS = false;

      if (rowNode) {
        const btn = rowNode.querySelector('button.btn-setting');
        if (btn && (btn.getAttribute('onclick') || '').includes('END NS')) {
          hasEndNS = true;
        }
      } else if (Array.isArray(rowData)) {
        hasEndNS = rowData.some(col => typeof col === 'string' && col.includes('END NS'));
      }

      if (hasEndNS) {
        const parsedNo = parseInt(Array.isArray(rowData) ? rowData[0] : this.cell(this.index(), 0).data(), 10);
        if (!isNaN(parsedNo)) {
          foundThreshold = parsedNo;
        }
      }
    });

    return foundThreshold;
  }

  function applyShiftColorsToTable(tableSelector) {
    if (thresholdNoAnalisa === null) return;
    const table = document.querySelector(tableSelector);
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th'));
    let noAnalisaIdx = headers.findIndex(th => th.innerText.toLowerCase().includes('no analisa'));
    if (noAnalisaIdx === -1) noAnalisaIdx = (tableSelector === '#tableInputResult') ? 1 : 0;

    table.querySelectorAll('tbody tr').forEach(tr => {
      if (tr.classList.contains('dataTables_empty')) return;
      const cells = tr.querySelectorAll('td');
      if (!cells.length) return;

      const currentNo = parseInt(cells[noAnalisaIdx]?.innerText.trim(), 10);
      if (isNaN(currentNo)) return;

      const targetBg = currentNo <= thresholdNoAnalisa ? colorShift1 : colorShift2;
      tr.style.setProperty('background-color', targetBg, 'important');
      cells.forEach(td => td.style.setProperty('background-color', targetBg, 'important'));
    });
  }

  function applyAllShiftColors() {
    applyShiftColorsToTable('#tablePrepAnalysis');
    applyShiftColorsToTable('#tableInputResult');
  }

  function enable(isShiftEnabledFlag) {
    thresholdNoAnalisa = scanThresholdEndNS();
    if (thresholdNoAnalisa === null) return;

    const prepTableEl = document.getElementById('tablePrepAnalysis');
    if (prepTableEl && window.jQuery) {
      jQuery(prepTableEl).off('draw.dt.ztvShift').on('draw.dt.ztvShift', () => {
        if (isShiftEnabledFlag()) applyShiftColorsToTable('#tablePrepAnalysis');
      });
    }

    const inputTableEl = document.getElementById('tableInputResult');
    if (inputTableEl && window.jQuery) {
      jQuery(inputTableEl)
        .off('xhr.dt.ztvShift draw.dt.ztvShift')
        .on('xhr.dt.ztvShift draw.dt.ztvShift', () => {
          if (isShiftEnabledFlag()) {
            setTimeout(() => applyShiftColorsToTable('#tableInputResult'), 150);
          }
        });

      const tbody = inputTableEl.querySelector('tbody');
      if (tbody && !tbody._ztvObserverAttached) {
        tbody._ztvObserverAttached = true;
        const observer = new MutationObserver(() => {
          if (isShiftEnabledFlag()) applyShiftColorsToTable('#tableInputResult');
        });
        observer.observe(tbody, { childList: true });
      }
    }

    applyAllShiftColors();
  }

  function disable() {
    ['#tablePrepAnalysis', '#tableInputResult'].forEach(selector => {
      const el = document.querySelector(selector);
      if (el && window.jQuery) {
        jQuery(el).off('.ztvShift');
        el.querySelectorAll('tbody tr').forEach(tr => {
          tr.style.removeProperty('background-color');
          tr.querySelectorAll('td').forEach(td => td.style.removeProperty('background-color'));
        });
      }
    });
    thresholdNoAnalisa = null;
  }

  function refresh(isShiftEnabledFlag) {
    if (thresholdNoAnalisa === null) thresholdNoAnalisa = scanThresholdEndNS();
    if (thresholdNoAnalisa !== null && isShiftEnabledFlag()) applyAllShiftColors();
  }

  return { enable, disable, refresh };
})();