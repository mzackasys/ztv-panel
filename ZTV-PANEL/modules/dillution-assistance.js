// modules/dillution-assistance.js
window.ZTV_MODULES = window.ZTV_MODULES || {};
window.ZTV_MODULES.dillutionAssistance = (() => {
  const PANEL_ID = 'ztvDillutionAssistanceCard';
  const COLLAPSE_ID = 'collapseDillutionAssistance';
  const GRID_ID = 'dillutionAssistanceButtonsGrid';
  const MODAL_ID = 'ztvDillutionModal';
  const CHANGED_BG = '#fff3cd'; // warna textbox yang nilainya berubah (belum di-apply)

  let isShown = false;

  const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const isEnabledInput = (inp) => !inp.disabled && !inp.readOnly && !inp.hasAttribute('disabled') && !inp.hasAttribute('readonly');

  function getCountingCard() {
    const countingBtn = document.querySelector('button[data-bs-target="#collapseCountingAssistance"]');
    if (!countingBtn) return null;
    return countingBtn.closest('.card') || countingBtn.parentElement;
  }

  // Fitur hanya bisa dipakai saat tab Input Result aktif & panel Counting Assistance ada
  function isAvailable() {
    const tabBtn = document.getElementById('input-result-tab');
    const isActive = tabBtn && (tabBtn.classList.contains('active') || tabBtn.getAttribute('aria-selected') === 'true');
    return !!(isActive && getCountingCard());
  }

  // ---------- 1. Baca semua baris tabel Input Result ----------
  function collectRows() {
    const tableEl = document.getElementById('tableInputResult');
    if (!tableEl || !window.jQuery || !jQuery.fn.dataTable) {
      console.warn('[Dillution Assistance] Tabel #tableInputResult tidak ditemukan.');
      return [];
    }
    const dt = jQuery(tableEl).DataTable();

    const col = { parameter: -1, noAnalisa: -1, pooling: -1, sample: -1, titik: -1, testUnit: -1 };
    dt.columns().every(function (idx) {
      const t = this.header().innerText.trim().toLowerCase();
      if (t === 'parameter') col.parameter = idx;
      if (t === 'no analisa') col.noAnalisa = idx;
      if (t === 'pooling no') col.pooling = idx;
      if (t === 'sample no') col.sample = idx;
      if (t === 'titik') col.titik = idx;
      if (t === 'test unit') col.testUnit = idx;
    });
    if (col.parameter < 0) {
      console.warn('[Dillution Assistance] Kolom "Parameter" tidak ditemukan.');
      return [];
    }
    const cellText = (rowIdx, c) => (c < 0 ? '-' : stripHtml(dt.cell(rowIdx, c).data()) || '-');

    const rows = [];
    dt.rows({ order: 'applied' }).every(function (rowIdx) {
      let node = this.node();
      let isLive = true;
      // Baris belum di-render: baca dari data mentah (tidak bisa diedit dari modal)
      if (!node) {
        const data = this.data();
        node = document.createElement('div');
        node.innerHTML = (Array.isArray(data) ? data : Object.values(data || {})).join(' ');
        isLive = false;
      }

      const enabledInputs = Array.from(node.querySelectorAll('input.row-dilution-input')).filter(isEnabledInput);
      if (!enabledInputs.length) return; // hanya textbox disabled -> abaikan

      const parameter = cellText(rowIdx, col.parameter);
      if (parameter === '-') return;

      rows.push({
        parameter,
        noAnalisa: cellText(rowIdx, col.noAnalisa),
        pooling: cellText(rowIdx, col.pooling),
        sample: cellText(rowIdx, col.sample),
        titik: cellText(rowIdx, col.titik),
        testUnit: cellText(rowIdx, col.testUnit),
        input: isLive ? enabledInputs[0] : null, // textbox asli di tabel
        value: enabledInputs[0].value.trim(),
        isEmpty: enabledInputs.some(inp => inp.value.trim() === ''),
        onCurrentPage: isLive && node.isConnected,
      });
    });
    return rows;
  }

  function getPendingParameters() {
    const stats = new Map();
    collectRows().forEach(r => {
      if (!stats.has(r.parameter)) stats.set(r.parameter, { kosong: 0, terisi: 0 });
      stats.get(r.parameter)[r.isEmpty ? 'kosong' : 'terisi']++;
    });
    return [...stats.entries()].filter(([, s]) => s.kosong > 0).map(([p, s]) => ({ parameter: p, kosong: s.kosong }));
  }

  // ---------- 2. Tulis nilai ke textbox asli di tabel ----------
  function writeToOriginal(origInput, value) {
    if (!origInput) return;
    origInput.value = value;
    origInput.dispatchEvent(new Event('input', { bubbles: true }));
    origInput.dispatchEvent(new Event('change', { bubbles: true }));
    if (window.jQuery) jQuery(origInput).trigger('change');
  }

  // Urutkan No Analisa dari kecil ke besar (angka dulu, lalu teks)
  function compareNoAnalisa(a, b) {
    const na = parseFloat(a.noAnalisa), nb = parseFloat(b.noAnalisa);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    if (!isNaN(na)) return -1;
    if (!isNaN(nb)) return 1;
    return a.noAnalisa.localeCompare(b.noAnalisa, undefined, { numeric: true });
  }

  // ---------- 3. Modal tabel sampel per parameter ----------
  function showParameterModal(parameter) {
    document.getElementById(MODAL_ID)?.remove();
    const rows = collectRows().filter(r => r.parameter === parameter).sort(compareNoAnalisa);
    const offPage = rows.filter(r => !r.onCurrentPage).length;

    const modalEl = document.createElement('div');
    modalEl.id = MODAL_ID;
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.innerHTML = `
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header text-white py-3" style="background-color: #22c55e;">
            <h5 class="modal-title fw-bold m-0 d-flex align-items-center flex-wrap gap-2">
              <span><i class="fa fa-flask me-2"></i>Dillution Assistance</span>
              <span class="ztv-dill-param badge bg-warning text-dark px-3 py-2" style="font-size: 0.95rem;"></span>
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-3">
            <div class="ztv-dill-summary mb-2 text-muted" style="font-size: 0.85rem;"></div>
            <div class="table-responsive border rounded-3" style="max-height: 60vh;">
              <table class="table table-bordered table-striped table-sm align-middle mb-0">
                <thead class="table-light sticky-top">
                  <tr>
                    <th class="text-center" style="width: 100px;">No Analisa</th>
                    <th>Pooling No</th>
                    <th>Sample No</th>
                    <th>Titik</th>
                    <th style="min-width: 200px;">Parameter</th>
                    <th class="text-center" style="width: 120px;">Test Unit</th>
                    <th style="width: 130px;">
                      <div class="d-flex flex-column align-items-center gap-1">
                        <input class="form-control ztvApplyInputDilution" type="number" step="any" placeholder="Apply Dilution" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;">
                        <button type="button" class="btn btn-sm btn-primary ztvBtnApplyInputDilution w-100" style="font-size: 0.75rem; padding: 0.2rem 0.4rem;">Apply All</button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer py-2 d-flex justify-content-between">
            <span class="ztv-dill-changed text-muted" style="font-size: 0.85rem;"></span>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-outline-secondary px-3 fw-bold" data-bs-dismiss="modal">Batal</button>
              <button type="button" class="btn btn-success px-4 fw-bold ztvBtnDillApply" disabled>
                <i class="fa fa-check me-1"></i>Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    // Nama parameter tampil sebagai label berwarna di judul
    modalEl.querySelector('.ztv-dill-param').textContent = parameter;
    const summary = modalEl.querySelector('.ztv-dill-summary');
    summary.textContent = `${rows.length} sampel, ${rows.filter(r => r.isEmpty).length} dilution masih kosong.`;
    if (offPage) {
      const warn = document.createElement('div');
      warn.className = 'alert alert-warning py-1 px-2 mt-2 mb-0';
      warn.textContent = `⚠️ ${offPage} sampel berada di halaman tabel lain. Aktifkan "Show 1000 data" agar semua nilai pasti tersimpan.`;
      summary.appendChild(warn);
    }

    const btnApply = modalEl.querySelector('.ztvBtnDillApply');
    const changedLabel = modalEl.querySelector('.ztv-dill-changed');
    const modalInputs = [];

    // Tandai textbox yang berubah & aktifkan tombol Apply kalau ada perubahan
    function refreshChangedState() {
      let changed = 0;
      modalInputs.forEach(({ inp, row }) => {
        const isChanged = inp.value.trim() !== row.value;
        inp.style.backgroundColor = isChanged ? CHANGED_BG : '';
        if (isChanged) changed++;
      });
      changedLabel.textContent = changed ? `${changed} dilution akan diubah` : 'Belum ada perubahan';
      btnApply.disabled = changed === 0;
    }

    const tbody = modalEl.querySelector('tbody');
    rows.forEach(r => {
      const tr = document.createElement('tr');
      [r.noAnalisa, r.pooling, r.sample, r.titik, r.parameter, r.testUnit].forEach((val, ci) => {
        const td = document.createElement('td');
        if (ci === 0) td.className = 'text-center fw-bold';
        if (ci === 5) td.className = 'text-center';
        td.textContent = val;
        tr.appendChild(td);
      });

      const tdInp = document.createElement('td');
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = 'any';
      inp.className = 'form-control form-control-sm text-center';
      inp.value = r.value;
      if (!r.input) {
        inp.disabled = true;
        inp.title = 'Baris belum di-render oleh tabel, tidak bisa diedit dari sini';
      } else {
        inp.addEventListener('input', refreshChangedState);
        modalInputs.push({ inp, row: r });
      }
      tdInp.appendChild(inp);
      tr.appendChild(tdInp);
      tbody.appendChild(tr);
    });
    refreshChangedState();

    // Apply All: hanya mengisi textbox di modal (belum ke tabel asli)
    modalEl.querySelector('.ztvBtnApplyInputDilution').addEventListener('click', () => {
      const val = modalEl.querySelector('.ztvApplyInputDilution').value.trim();
      if (val === '') return;
      modalInputs.forEach(({ inp }) => { inp.value = val; });
      refreshChangedState();
    });

    // Apply (footer): pindahkan nilai yang berubah ke textbox asli, lalu tutup modal
    btnApply.addEventListener('click', () => {
      let applied = 0;
      modalInputs.forEach(({ inp, row }) => {
        const val = inp.value.trim();
        if (val !== row.value) {
          writeToOriginal(row.input, val);
          applied++;
        }
      });
      console.log(`[Dillution Assistance] ${applied} dilution diterapkan ke tabel [${parameter}].`);
      if (window.bootstrap && bootstrap.Modal) bootstrap.Modal.getInstance(modalEl)?.hide();
    });

    // Setelah modal ditutup: hapus modal & hitung ulang tombol parameter
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
      renderButtons();
    });

    if (window.bootstrap && bootstrap.Modal) new bootstrap.Modal(modalEl).show();
  }

  // ---------- 4. Render tombol di dalam collapse ----------
  function renderButtons() {
    const grid = document.getElementById(GRID_ID);
    const badge = document.getElementById('ztvDillutionBadge');
    if (!grid) return;
    const list = getPendingParameters();
    grid.innerHTML = '';
    if (badge) badge.textContent = list.length;

    if (!list.length) {
      grid.innerHTML = '<div class="col-12 text-center text-muted py-2">Semua dilution sudah terisi 🎉</div>';
      return;
    }
    list.forEach(item => {
      const col = document.createElement('div');
      col.className = 'col';
      const btn = document.createElement('button');
      btn.type = 'button';
      // Sengaja TIDAK pakai class btn-parameter-assist agar tidak bentrok dengan Counting Assistance / Repeat SPC
      btn.className = 'btn btn-counting-assist-item btn-dillution-assist w-100 py-2 text-truncate animate__animated animate__fadeIn';
      btn.dataset.parameter = item.parameter;
      btn.title = `${item.parameter} (${item.kosong} baris kosong)`;
      btn.textContent = item.parameter;
      btn.addEventListener('click', () => showParameterModal(item.parameter));
      col.appendChild(btn);
      grid.appendChild(col);
    });
  }

  // ---------- 5. Panel collapse di atas Counting Assistance ----------
  function injectPanel() {
    if (document.getElementById(PANEL_ID)) return true;
    const countingCard = getCountingCard();
    if (!countingCard) return false;

    const card = document.createElement('div');
    card.id = PANEL_ID;
    card.className = countingCard.className;
    card.innerHTML = `
      <button class="btn w-100 text-white text-start px-4 py-3 fw-bold rounded-0 shadow-none border-0 d-flex justify-content-between align-items-center collapsed"
              type="button" data-bs-toggle="collapse" data-bs-target="#${COLLAPSE_ID}" aria-expanded="false" aria-controls="${COLLAPSE_ID}"
              style="background-color: #22c55e; font-size: 1rem;">
        <span><i class="fa fa-flask me-2"></i>Dillution Assistance <span id="ztvDillutionBadge" class="badge bg-light text-success ms-2">0</span></span>
        <i class="fa fa-chevron-down"></i>
      </button>
      <div class="collapse" id="${COLLAPSE_ID}">
        <div class="card-body bg-white p-3 border-top border-light">
          <div class="row row-cols-1 row-cols-sm-2 row-cols-md-5 g-2" id="${GRID_ID}"></div>
        </div>
      </div>
    `;
    countingCard.parentNode.insertBefore(card, countingCard);

    document.getElementById(COLLAPSE_ID).addEventListener('show.bs.collapse', renderButtons);
    renderButtons();
    return true;
  }

  function show() {
    if (!isAvailable()) return false;
    isShown = injectPanel();
    return isShown;
  }

  function hide() {
    isShown = false;
    document.getElementById(PANEL_ID)?.remove();
  }

  // Dipanggil berkala dari main.js: pasang ulang kalau halaman me-render ulang area Counting Assistance
  function refresh() {
    if (isShown && !document.getElementById(PANEL_ID)) injectPanel();
  }

  return { show, hide, refresh, isAvailable, isShown: () => isShown };
})();
