// modules/grouping-salmonella.js
window.ZTV_MODULES = window.ZTV_MODULES || {};
window.ZTV_MODULES.groupingSalmonella = (() => {
  const MODAL_ID = 'ztvGroupingSalmonellaModal';

  const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, '').trim();
  // Buang akhiran seperti " (260)" dari Sample No
  const cleanSample = (s) => stripHtml(s).replace(/\s*\(\d+\)\s*$/, '');

  function collectGroups() {
    const tableEl = document.getElementById('tablePrepAnalysis');
    if (!tableEl || !window.jQuery || !jQuery.fn.dataTable) {
      return { error: 'Tabel Prep Analysis tidak ditemukan. Buka tab Prep Analysis terlebih dahulu.' };
    }
    const dt = jQuery(tableEl).DataTable();

    // Cari index kolom dari teks header (tetap jalan walau kolom di-hide)
    let sampleColIdx = -1;
    let salmoColIdx = -1;
    dt.columns().every(function (idx) {
      const text = this.header().innerText.trim().toLowerCase();
      if (text === 'sample no') sampleColIdx = idx;
      if (text === 'no salmonella') salmoColIdx = idx;
    });
    if (sampleColIdx < 0 || salmoColIdx < 0) {
      return { error: 'Kolom "Sample No" atau "No Salmonella" tidak ditemukan di tabel.' };
    }

    // Kumpulkan semua baris (semua halaman) sesuai urutan tabel
    const rows = [];
    dt.rows({ order: 'applied' }).every(function (rowIdx) {
      const node = this.node();

      // Ambil nilai live dari textbox (termasuk yang baru diketik user)
      let salmoVal = '';
      const input = node && node.querySelector('input.prep-no-salmonella-input');
      if (input) {
        salmoVal = input.value.trim();
      } else {
        const raw = String(dt.cell(rowIdx, salmoColIdx).data() ?? '');
        const m = raw.match(/value="([^"]*)"/);
        salmoVal = m ? m[1].trim() : stripHtml(raw);
      }

      const sampleNo = cleanSample(dt.cell(rowIdx, sampleColIdx).data());
      if (salmoVal !== '' && sampleNo) rows.push({ salmo: salmoVal, sampleNo });
    });

    // Grouping per nilai No Salmonella
    const groups = new Map();
    rows.forEach((r, i) => {
      if (!groups.has(r.salmo)) groups.set(r.salmo, { samples: [], positions: [] });
      const g = groups.get(r.salmo);
      g.samples.push(r.sampleNo);
      g.positions.push(i);
    });

    const result = [...groups.entries()]
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([no, g]) => {
        const first = g.samples[0];
        const last = g.samples[g.samples.length - 1];
        const contiguous = g.positions.every((p, i) => i === 0 || p === g.positions[i - 1] + 1);
        return {
          no,
          kode: g.samples.length === 1 ? first : `${first}-${last}`,
          jumlah: g.samples.length,
          contiguous,
        };
      });

    return { result, totalRows: rows.length };
  }

  async function copyStringToClipboard(textToCopy, containerModal) {
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      } catch (err) {}
    }
    if (!success) {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      ta.style.cssText = 'position: fixed; top: 0; left: 0; width: 2em; height: 2em; background: transparent;';
      (containerModal || document.body).appendChild(ta);
      ta.focus();
      ta.select();
      try {
        success = document.execCommand('copy');
      } catch (err) {
        success = false;
      }
      ta.remove();
    }
    return success;
  }

  function buildRow(item) {
    const tr = document.createElement('tr');

    const tdNo = document.createElement('td');
    tdNo.className = 'text-center fw-bold';
    tdNo.textContent = item.no;

    const tdKode = document.createElement('td');
    tdKode.textContent = item.kode;
    if (!item.contiguous) {
      const warn = document.createElement('span');
      warn.className = 'badge bg-warning text-dark ms-2';
      warn.title = 'Sampel dengan nomor ini tidak berurutan di tabel';
      warn.textContent = '⚠️ tidak berurutan';
      tdKode.appendChild(warn);
    }

    const tdJumlah = document.createElement('td');
    tdJumlah.className = 'text-center';
    tdJumlah.textContent = item.jumlah;

    tr.append(tdNo, tdKode, tdJumlah);
    return tr;
  }

  function showModal() {
    const existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();

    const { result, totalRows, error } = collectGroups();

    const modalEl = document.createElement('div');
    modalEl.id = MODAL_ID;
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header bg-success text-white py-3">
            <h5 class="modal-title fw-bold m-0"><i class="fa fa-object-group me-2"></i>Grouping Salmonella by ZTV 🔥</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-3">
            <div id="ztvSalmoSummary" class="mb-2 text-muted" style="font-size: 0.85rem;"></div>
            <div class="table-responsive border rounded-3" style="max-height: 520px;">
              <table class="table table-bordered table-striped table-sm align-middle mb-0">
                <thead class="table-dark sticky-top">
                  <tr>
                    <th style="width: 12%;" class="text-center">No</th>
                    <th>Kode Sampel</th>
                    <th style="width: 12%;" class="text-center">Jumlah</th>
                  </tr>
                </thead>
                <tbody id="ztvSalmoTbody"></tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-success px-3 fw-bold d-flex align-items-center gap-1 shadow-sm" id="btnZtvSalmoCopy">
              <i class="fa fa-copy"></i> <span>Copy to Clipboard</span>
            </button>
            <button type="button" class="btn btn-outline-secondary px-3 fw-bold" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    const tbody = modalEl.querySelector('#ztvSalmoTbody');
    const summary = modalEl.querySelector('#ztvSalmoSummary');
    const btnCopy = modalEl.querySelector('#btnZtvSalmoCopy');

    if (error) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4"></td></tr>';
      tbody.querySelector('td').textContent = error;
      btnCopy.disabled = true;
    } else if (!result.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Belum ada nilai No Salmonella yang terisi.</td></tr>';
      btnCopy.disabled = true;
    } else {
      summary.textContent = `${totalRows} sampel terisi, ${result.length} grup.`;
      result.forEach(item => tbody.appendChild(buildRow(item)));
    }

    btnCopy.addEventListener('click', async () => {
      if (!result || !result.length) return;
      // Tab-separated agar bisa langsung di-paste ke Excel (2 kolom)
      const text = result.map(r => `${r.no}\t${r.kode}`).join('\n');
      const ok = await copyStringToClipboard(text, modalEl);
      if (ok) {
        const originalHtml = btnCopy.innerHTML;
        btnCopy.className = 'btn btn-primary px-3 fw-bold d-flex align-items-center gap-1 shadow-sm';
        btnCopy.innerHTML = '<i class="fa fa-check"></i> Copied';
        setTimeout(() => {
          btnCopy.className = 'btn btn-success px-3 fw-bold d-flex align-items-center gap-1 shadow-sm';
          btnCopy.innerHTML = originalHtml;
        }, 2500);
      }
    });

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());

    if (window.bootstrap && bootstrap.Modal) {
      new bootstrap.Modal(modalEl).show();
    }
  }

  return { showModal, collectGroups };
})();
