// modules/button-approve.js
window.ZTV_MODULES = window.ZTV_MODULES || {};
window.ZTV_MODULES.buttonApprove = (() => {
  const TABLE_ID = 'dataTableResultVerification';
  const BTN_APPROVE_ID = 'btnApproveAllCustom';
  const MODAL_ID = 'customPositiveAlertModal';
  const BACKDROP_ID = 'customModalBackdropZTV';

  let hookedProceedBtn = null;
  let bypassIntercept = false;

  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function isAvailable() {
    return !!document.getElementById(TABLE_ID);
  }

  // =========================================================================
  // 1. TOMBOL "APPROVE ALL"
  // =========================================================================
  function approveAll() {
    const radios = document.querySelectorAll('input.verif-radio-approve');
    let count = 0;
    radios.forEach(radio => {
      if (!radio.checked) {
        radio.checked = true;
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        count++;
      }
    });
    console.log(`ZTV: Berhasil memilih ${count} baris sebagai APPROVED.`);
  }

  function injectApproveButton(btnProceed) {
    if (document.getElementById(BTN_APPROVE_ID)) return;
    const newBtn = document.createElement('button');
    newBtn.type = 'button';
    newBtn.id = BTN_APPROVE_ID;
    newBtn.className = 'btn btn-info me-2 px-4 waves-effect waves-light';
    newBtn.innerText = 'Approve All';
    newBtn.addEventListener('click', approveAll);
    btnProceed.insertAdjacentElement('beforebegin', newBtn);
  }

  // =========================================================================
  // 2. FUNGSI PARSING DATA POSITIF (PRESISI FIXEDCOLUMNS & DATATABLES)
  // =========================================================================
  function getPositiveSamples() {
    const table = document.getElementById(TABLE_ID);
    if (!table) return [];

    const hasDT = window.jQuery && jQuery.fn.DataTable && jQuery.fn.DataTable.isDataTable(`#${TABLE_ID}`);
    const dtApi = hasDT ? jQuery(`#${TABLE_ID}`).DataTable() : null;

    let headerTexts = [];
    if (dtApi) {
      dtApi.columns().every(function () {
        if (this.visible()) {
          headerTexts.push(this.header().textContent.trim().toLowerCase());
        }
      });
    } else if (table.tHead && table.tHead.rows.length > 0) {
      headerTexts = Array.from(table.tHead.rows[0].cells).map(th => th.textContent.trim().toLowerCase());
    }

    const colIdx = {
      sampleNumber: headerTexts.findIndex(h => h.includes('sample number')),
      poolingNumber: headerTexts.findIndex(h => h.includes('pooling number')),
      testParameter: headerTexts.findIndex(h => h.includes('test parameter')),
      result: headerTexts.findIndex(h => h === 'result' || h.includes('result')),
      receivedDate: headerTexts.findIndex(h => h.includes('received date')),
      startDate: headerTexts.findIndex(h => h.includes('start date')),
    };

    const rows = dtApi
      ? dtApi.rows().nodes().toArray()
      : Array.from(table.querySelectorAll('tbody tr'));

    const positiveList = [];
    rows.forEach(tr => {
      if (!tr) return;
      const cells = Array.from(tr.cells);
      if (!cells.length || colIdx.result === -1) return;

      const resultCell = cells[colIdx.result];
      if (!resultCell) return;

      const resultInput = resultCell.querySelector('input.cell-result, input[type="text"]');
      const resultVal = resultInput ? resultInput.value.trim() : resultCell.textContent.trim();

      if (/positiv|positif/i.test(resultVal)) {
        const getCellText = (idx) => {
          if (idx === -1 || !cells[idx]) return '-';
          const inp = cells[idx].querySelector('input, select, textarea');
          const raw = inp ? inp.value : cells[idx].textContent;
          return raw.replace(/\s+/g, ' ').trim() || '-';
        };
        positiveList.push({
          sampleNumber: getCellText(colIdx.sampleNumber),
          poolingNumber: getCellText(colIdx.poolingNumber),
          testParameter: getCellText(colIdx.testParameter),
          result: resultVal,
          receivedDate: getCellText(colIdx.receivedDate),
          startDate: getCellText(colIdx.startDate),
        });
      }
    });
    return positiveList;
  }

  // =========================================================================
  // 3. MODAL POPUP KONFIRMASI (DENGAN LOGO WARNING)
  // =========================================================================
  function closeModal() {
    document.getElementById(MODAL_ID)?.remove();
    document.getElementById(BACKDROP_ID)?.remove();
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  function showPositiveModal(positiveSamples, onConfirmCallback) {
    closeModal();

    const rowsHtml = positiveSamples.length > 0
      ? positiveSamples.map((item, idx) => `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td class="fw-semibold">${escapeHtml(item.sampleNumber)}</td>
            <td>${escapeHtml(item.poolingNumber)}</td>
            <td>${escapeHtml(item.testParameter)}</td>
            <td class="text-center">
              <span class="badge bg-danger px-2 py-1">${escapeHtml(item.result)}</span>
            </td>
            <td class="text-center">${escapeHtml(item.receivedDate)}</td>
            <td class="text-center">${escapeHtml(item.startDate)}</td>
          </tr>
        `).join('')
      : `
          <tr>
            <td colspan="7" class="text-center text-muted py-4">
              Tidak ditemukan sampel dengan hasil <strong>Positive</strong> pada tabel ini.
            </td>
          </tr>
        `;

    const headerBg = positiveSamples.length > 0 ? 'bg-danger text-white' : 'bg-success text-white';

    // Ikon segitiga peringatan SVG (inline agar selalu tampil tajam)
    const warningIconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="me-2 flex-shrink-0" viewBox="0 0 16 16" style="vertical-align: -3px;">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </svg>
    `;

    const modalHtml = `
      <div id="${BACKDROP_ID}" style="position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 99998;"></div>
      <div class="modal show d-block" id="${MODAL_ID}" tabindex="-1" role="dialog" style="position: fixed; inset: 0; z-index: 99999; overflow-y: auto; pointer-events: auto;">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style="pointer-events: auto;">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-header ${headerBg}">
              <h5 class="modal-title fw-bold text-white mb-0 d-flex align-items-center">
                ${warningIconSvg}
                <span>Warning by ZTV</span>
              </h5>
              <button type="button" class="btn-close btn-close-white" id="btnCloseXCustomZTV" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-3 fs-6">terdapat <strong>${positiveSamples.length}</strong> sampel positif, silahkan review kembali sebelum proceed</p>
              <div class="table-responsive" style="max-height: 60vh;">
                <table class="table table-bordered table-hover table-sm align-middle mb-0">
                  <thead class="table-light text-center sticky-top">
                    <tr>
                      <th style="width: 45px;">No</th>
                      <th>Sample Number</th>
                      <th>Pooling Number</th>
                      <th>Test Parameter</th>
                      <th>Result</th>
                      <th>Received Date</th>
                      <th>Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer bg-light">
              <button type="button" class="btn btn-secondary px-4" id="btnCancelCustomZTV">Batal</button>
              <button type="button" class="btn btn-primary px-4" id="btnConfirmProceedCustom">
                Lanjutkan Proceed (${positiveSamples.length} Positive)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById(MODAL_ID);

    document.getElementById('btnCloseXCustomZTV').addEventListener('click', closeModal);
    document.getElementById('btnCancelCustomZTV').addEventListener('click', closeModal);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });
    document.getElementById('btnConfirmProceedCustom').addEventListener('click', () => {
      closeModal();
      onConfirmCallback();
    });
  }

  // =========================================================================
  // 4. INTERCEPT KLIK PADA #btnProceed
  // =========================================================================
  function onProceedClick(e) {
    if (bypassIntercept) {
      bypassIntercept = false;
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const btnProceed = e.currentTarget;
    showPositiveModal(getPositiveSamples(), () => {
      bypassIntercept = true;
      btnProceed.click();
    });
  }

  function unhookProceed() {
    if (hookedProceedBtn) {
      hookedProceedBtn.removeEventListener('click', onProceedClick, true);
      delete hookedProceedBtn.dataset.ztvHooked;
      hookedProceedBtn = null;
    }
  }

  // Aman dipanggil berulang (dari interval main.js); hanya pasang yang belum ada
  function enable() {
    if (!isAvailable()) return;
    const btnProceed = document.getElementById('btnProceed');
    if (!btnProceed) return;

    injectApproveButton(btnProceed);

    if (hookedProceedBtn !== btnProceed) {
      unhookProceed(); // tombol lama sudah diganti oleh halaman
      btnProceed.addEventListener('click', onProceedClick, true);
      btnProceed.dataset.ztvHooked = 'true';
      hookedProceedBtn = btnProceed;
    }
  }

  function disable() {
    document.getElementById(BTN_APPROVE_ID)?.remove();
    unhookProceed();
    bypassIntercept = false;
    closeModal();
  }

  return { enable, disable, isAvailable };
})();
