// modules/brecal.js
window.ZTV_MODULES = window.ZTV_MODULES || {};

window.ZTV_MODULES.brecal = (() => {
  const STORAGE_KEY = 'ZTV_PARAM_GROUPING_CONFIG';
  const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxYVxDxVju05X9HyGQ01_-7Dwc8SI0bXdVHG2DbJOiLx0jTEjnLTULE35qd-B1b2KRT/exec";

  const MASTER_ORG_ROWS = [
    { name: 'FG Internal SHP (SHP)',           prefixes: ['SHP'] },
    { name: 'FG External NKK (NKK)',           prefixes: ['NKK'] },
    { name: 'FG External UJA (UJA)',           prefixes: ['UJA'] },
    { name: 'FG External KMI (KMI)',           prefixes: ['KMI'] },
    { name: 'FG External TPP (TPI)',           prefixes: ['TPI'] },
    { name: 'FG External TRS (TRS)',           prefixes: ['TRS'] },
    { name: 'FG External ALN (ALN)',           prefixes: ['ALN'] },
    { name: 'FG External DKE (DKE)',           prefixes: ['DKE'] },
    { name: 'LNK',                             prefixes: ['LNK'] },
    { name: 'QAC/LAB',                         prefixes: ['LAB'] },
    { name: '(Kosong)',                        prefixes: [] },
    { name: 'Sampel Liquid (Header)',          prefixes: [] },
    { name: 'FG Liquid External Milko (MBI)',   prefixes: ['MBI'] },
    { name: 'FG Liquid External KAMI (KAM)',   prefixes: ['KAM'] },
    { name: 'FG Liquid External ISA',          prefixes: ['ISA'] },
    { name: 'FG Liquid External GPP',          prefixes: ['GPP'] },
    { name: '(POTS Tambahan)',                 prefixes: [] },
    { name: '(Kosong)',                        prefixes: [] },
    { name: 'Lainnya (Header)',                prefixes: [] },
    { name: 'Raw Material (KNS-RM)',           prefixes: ['KNS'] },
    { name: 'Prodev (IDC)',                    prefixes: ['IDC'] },
    { name: 'Fairpack (FIN)',                  prefixes: ['FIN'] },
    { name: 'Global Vita Nutritech (GVN)',     prefixes: ['GVN'] },
    { name: 'RTS Swab + Non Swab',             prefixes: ['RTS'] },
    { name: 'RTS Swabtest',                    prefixes: [] }
  ];

  const MASTER_GROUPS = [
    "ALT / Standard plate count",
    "ALT / Standard plate count (cfu/ml)",
    "ALT 36C (AMDK)",
    "Thermophilic plate count",
    "Yeast and mould (non liquid)",
    "Yeast and mould (liquid)",
    "Yeast and mould (FDA)",
    "Coliform (AMDK)",
    "Coliform (kualitatif)",
    "Coliform (kuantitatif)",
    "Coliform MORINAGA",
    "Coliform (MPN)",
    "Escherichia coli (qualitative/gr)",
    "Escherichia coli (MPN/gr)",
    "Escherichia coli Kuantitatif TBX",
    "Salmonella per 25 g",
    "Staph. aureus (quantitative)",
    "Staph. aureus (qualitative)",
    "Staphylococcus aureus MPN",
    "Enterobacteriaceae (kualitatif)",
    "Enterobacteriaceae (kuantitatif)",
    "Enterobactericeae MPN",
    "Enterobacter sakazakii FDA",
    "Enterobacter sakazakii ISO",
    "Listeria monocytogenes FDA",
    "Listeria monocytogenes ISO",
    "Allergen test - CASEIN",
    "Pseudomonas aeruginosa (AMDK)",
    "Bacillus cereus (quantitative)",
    "Bacillus cereus (MPN)",
    "Bifidobacteria",
    "B. longum",
    "B. breve",
    "B. infantis M63",
    "Thermoresistant Mesophilic Spore",
    "Thermoresistant Thermophilic Spore",
    "Total Spora",
    "Thioglycolate test",
    "Clostridium perfringens",
    "Pewarnaan Gram",
    "Identifikasi Gram Positif",
    "Identifikasi Gram Negatif",
    "Identifikasi Yeast",
    "Identifikasi Mold",
    "Identifikasi Anaerob",
    "Residu Antibiotik",
    "Bakteri Asam Laktat"
  ];

  function getSelectedDateTitle() {
    const headingEl = document.querySelector('h2.fw-bold.text-primary');
    if (headingEl) {
      const text = headingEl.innerText || '';
      const parts = text.split('-');
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
    }
    return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function getLocalConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }

  function saveLocalConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config, null, 2));
  }

  async function fetchRemoteGroupingConfig() {
    updateCloudStatusBadge('syncing', 'Menghubungkan ke Cloud...');
    try {
      const res = await fetch(GAS_WEBAPP_URL);
      if (!res.ok) throw new Error("Gagal mengambil data dari Google Sheets");
      const cloudConfig = await res.json();
      saveLocalConfig(cloudConfig);
      updateCloudStatusBadge('synced', 'Cloud Synced');
      return cloudConfig;
    } catch (err) {
      updateCloudStatusBadge('offline', 'Offline (Local Cache)');
      return getLocalConfig();
    }
  }

  async function syncSaveGroupingConfig(newConfig) {
    const sanitizedConfig = {};
    MASTER_GROUPS.forEach(group => {
      sanitizedConfig[group] = Array.isArray(newConfig[group]) ? newConfig[group] : [];
    });

    saveLocalConfig(sanitizedConfig);
    updateCloudStatusBadge('syncing', 'Menyimpan ke Cloud...');

    try {
      await fetch(GAS_WEBAPP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedConfig)
      });
      updateCloudStatusBadge('synced', 'Cloud Synced');
    } catch (err) {
      updateCloudStatusBadge('offline', 'Gagal Simpan Cloud');
    }
  }

  function updateCloudStatusBadge(state, text) {
    const badge = document.getElementById('ztvCloudStatusBadge');
    if (!badge) return;

    if (state === 'syncing') {
      badge.className = 'badge bg-warning text-dark py-2 px-3 fw-bold';
      badge.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" style="width:0.75rem;height:0.75rem;"></span>${text}`;
    } else if (state === 'synced') {
      badge.className = 'badge bg-light text-success border py-2 px-3 fw-bold';
      badge.innerHTML = `<i class="fa fa-check-circle me-1"></i>${text}`;
    } else {
      badge.className = 'badge bg-secondary text-white py-2 px-3 fw-bold';
      badge.innerHTML = `<i class="fa fa-exclamation-triangle me-1"></i>${text}`;
    }
  }

  function extractTableData() {
    const tableEl = document.getElementById('tablePrepAnalysis');
    if (!tableEl) return { orgCounts: {}, rawParamCounts: {} };

    const orgCounts = {};
    const rawParamCounts = {};

    if (window.jQuery && jQuery.fn.dataTable && jQuery.fn.DataTable.isDataTable(tableEl)) {
      const dt = jQuery(tableEl).DataTable();

      let sampleColIdx = -1;
      let paramColIdx = -1;

      try { sampleColIdx = dt.column('th[aria-label*="Sample No"]').index(); } catch (e) {}
      try { paramColIdx = dt.column('th[aria-label*="Parameter"]').index(); } catch (e) {}

      if (sampleColIdx === undefined || sampleColIdx < 0 || paramColIdx === undefined || paramColIdx < 0) {
        dt.columns().every(function(idx) {
          const header = this.header();
          const label = (header ? header.getAttribute('aria-label') || '' : '').toLowerCase();
          if (label.includes('sample no')) sampleColIdx = idx;
          if (label.includes('parameter')) paramColIdx = idx;
        });
      }

      if (sampleColIdx === -1) sampleColIdx = 1;
      if (paramColIdx === -1) paramColIdx = 3;

      dt.rows().every(function() {
        const rowData = this.data();
        let rawSample = '';
        let rawParam = '';

        if (Array.isArray(rowData)) {
          rawSample = rowData[sampleColIdx];
          rawParam = rowData[paramColIdx];
        } else if (rowData && typeof rowData === 'object') {
          const sampleKey = Object.keys(rowData).find(k => k.toLowerCase().includes('sample'));
          const paramKey = Object.keys(rowData).find(k => k.toLowerCase().includes('parameter'));
          rawSample = sampleKey ? rowData[sampleKey] : Object.values(rowData)[sampleColIdx];
          rawParam = paramKey ? rowData[paramKey] : Object.values(rowData)[paramColIdx];
        }

        if (this.node()) {
          const cells = this.node().querySelectorAll('td');
          if ((!rawSample || rawSample === '') && cells[sampleColIdx]) rawSample = cells[sampleColIdx].innerText.trim();
          if ((!rawParam || rawParam === '') && cells[paramColIdx]) rawParam = cells[paramColIdx].innerText.trim();
        }

        const cleanSample = String(rawSample || '').replace(/<[^>]*>/g, '').trim();
        if (cleanSample) {
          const prefix = cleanSample.substring(0, 3).toUpperCase();
          if (prefix && prefix !== 'NO ') {
            orgCounts[prefix] = (orgCounts[prefix] || 0) + 1;
          }
        }

        const cleanParam = String(rawParam || '').replace(/<[^>]*>/g, '').trim();
        if (cleanParam) {
          cleanParam.split(',').map(p => p.trim()).filter(Boolean).forEach(p => {
            rawParamCounts[p] = (rawParamCounts[p] || 0) + 1;
          });
        }
      });
    } else {
      const ths = Array.from(tableEl.querySelectorAll('thead th'));
      const sampleColIdx = ths.findIndex(th => (th.getAttribute('aria-label') || '').toLowerCase().includes('sample no'));
      const paramColIdx = ths.findIndex(th => (th.getAttribute('aria-label') || '').toLowerCase().includes('parameter'));

      const targetSampleIdx = sampleColIdx >= 0 ? sampleColIdx : 1;
      const targetParamIdx = paramColIdx >= 0 ? paramColIdx : 3;

      tableEl.querySelectorAll('tbody tr').forEach(tr => {
        if (tr.classList.contains('dataTables_empty')) return;
        const cells = tr.querySelectorAll('td');
        if (!cells.length) return;

        const cleanSample = String(cells[targetSampleIdx]?.innerText || '').replace(/<[^>]*>/g, '').trim();
        if (cleanSample) {
          const prefix = cleanSample.substring(0, 3).toUpperCase();
          if (prefix && prefix !== 'NO ') {
            orgCounts[prefix] = (orgCounts[prefix] || 0) + 1;
          }
        }

        const cleanParam = String(cells[targetParamIdx]?.innerText || '').replace(/<[^>]*>/g, '').trim();
        if (cleanParam) {
          cleanParam.split(',').map(p => p.trim()).filter(Boolean).forEach(p => {
            rawParamCounts[p] = (rawParamCounts[p] || 0) + 1;
          });
        }
      });
    }

    return { orgCounts, rawParamCounts };
  }

  function calculateGroupedSummary(config, rawParamCounts) {
    const groupedResult = {};
    const accountedRawKeys = new Set();

    MASTER_GROUPS.forEach(groupName => {
      const aliasList = config[groupName] || [];
      let total = 0;
      aliasList.forEach(alias => {
        if (rawParamCounts[alias]) {
          total += rawParamCounts[alias];
          accountedRawKeys.add(alias);
        }
      });
      groupedResult[groupName] = total > 0 ? total : null;
    });

    const unmapped = {};
    Object.entries(rawParamCounts).forEach(([param, count]) => {
      if (!accountedRawKeys.has(param)) {
        unmapped[param] = count;
      }
    });

    return { groupedResult, unmapped };
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
      const modalFooter = containerModal ? containerModal.querySelector('.modal-footer') : null;
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.width = '2em';
      ta.style.height = '2em';
      ta.style.background = 'transparent';

      (modalFooter || document.body).appendChild(ta);
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

  async function showModal() {
    let modalEl = document.getElementById('ztvGroupingCMSModal');
    if (modalEl) modalEl.remove();

    let assignModalEl = document.getElementById('ztvAssignGroupModal');
    if (assignModalEl) assignModalEl.remove();

    const selectedDate = getSelectedDateTitle();

    modalEl = document.createElement('div');
    modalEl.id = 'ztvGroupingCMSModal';
    modalEl.className = 'modal fade';
    modalEl.tabIndex = -1;
    modalEl.innerHTML = `
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style="max-width: 95%;">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header bg-success text-white py-3">
            <div class="d-flex align-items-center gap-2">
              <h5 class="modal-title fw-bold m-0"><i class="fa fa-dashboard me-2"></i>Breakdown Calculator by ZTV 🔥</h5>
              <span id="ztvCloudStatusBadge" class="badge bg-light text-dark py-2 px-3 fw-bold" style="font-size:0.85rem;">Loading...</span>
              <button type="button" class="btn btn-sm fw-bold d-inline-flex align-items-center shadow-sm" id="btnManualRefreshCloud" title="Refresh data dari Google Sheets" style="background-color: #d1e7dd; color: #0f5132; border: 1px solid #a3cfbb; font-size: 0.85rem; padding: 0.35rem 0.85rem; border-radius: 6px;">
                <i class="fa fa-refresh me-1" id="iconRefreshCloud"></i>Refresh Cloud
              </button>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          
          <ul class="nav nav-tabs px-3 pt-2 bg-light border-bottom" id="rekapTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active fw-bold text-success" id="tab-rekap-btn" data-bs-toggle="tab" data-bs-target="#tab-rekap" type="button" role="tab">
                <i class="fa fa-table me-1"></i>Rekap Data
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link fw-bold text-primary" id="tab-master-btn" data-bs-toggle="tab" data-bs-target="#tab-master" type="button" role="tab">
                <i class="fa fa-cogs me-1"></i>Master Group List (CMS)
              </button>
            </li>
          </ul>

          <div class="modal-body p-3">
            <div class="tab-content" id="rekapTabsContent">
              <div class="tab-pane fade show active" id="tab-rekap" role="tabpanel">
                <div class="alert alert-light border shadow-sm py-2 px-3 mb-3 d-flex align-items-center justify-content-between rounded-3">
                  <div class="d-flex align-items-center gap-2 text-dark">
                    <span class="badge bg-success py-1 px-2" style="font-size:0.8rem;"><i class="fa fa-calendar me-1"></i>Active Period</span>
                    <span class="fw-bold" style="font-size: 0.95rem;">Breakdown Calculator | ${selectedDate}</span>
                  </div>
                  <span class="badge bg-light text-muted border py-1 px-2" style="font-size: 0.75rem;">Equality DataTables Source</span>
                </div>

                <div class="row g-3">
                  <div class="col-md-5 border-end pe-md-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="fw-bold text-dark m-0"><i class="fa fa-building text-primary me-1"></i>Breakdown Sampel</h6>
                    </div>
                    <div class="table-responsive border rounded-3" style="max-height: 520px;">
                      <table class="table table-bordered table-striped table-sm align-middle mb-0">
                        <thead class="table-dark sticky-top">
                          <tr>
                            <th style="width: 12%;" class="text-center">No</th>
                            <th>POTS</th>
                            <th style="width: 25%;" class="text-center">Total</th>
                          </tr>
                        </thead>
                        <tbody id="tbodyOrgResult"></tbody>
                      </table>
                    </div>
                  </div>

                  <div class="col-md-7 ps-md-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="fw-bold text-dark m-0"><i class="fa fa-calculator text-success me-1"></i>Rekap Parameter</h6>
                    </div>
                    <div class="table-responsive border rounded-3" style="max-height: 520px;">
                      <table class="table table-bordered table-sm align-middle mb-0">
                        <thead class="table-dark sticky-top">
                          <tr>
                            <th style="width: 10%;" class="text-center">No</th>
                            <th>Parameter Group</th>
                            <th style="width: 20%;" class="text-center">Total</th>
                          </tr>
                        </thead>
                        <tbody id="tbodyCMSResult">
                          <tr><td colspan="3" class="text-center py-4">Menghitung...</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div class="tab-pane fade" id="tab-master" role="tabpanel">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 class="fw-bold text-dark m-0"><i class="fa fa-list me-1"></i>Daftar Master Group Parameter (Total 47)</h6>
                    <small class="text-muted">Kelola alias mapping parameter. Perubahan otomatis tersinkronisasi ke Cloud.</small>
                  </div>
                  <input type="text" id="inputFilterCMSGroup" class="form-control form-control-sm w-25" placeholder="Cari nama group...">
                </div>

                <div class="table-responsive border rounded-3" style="max-height: 520px;">
                  <table class="table table-bordered table-sm align-middle mb-0" id="tableCMSList">
                    <thead class="table-light sticky-top">
                      <tr>
                        <th style="width: 7%;" class="text-center">No</th>
                        <th style="width: 35%;">GroupName (Master)</th>
                        <th>Aliases di Kolom B (Klik × untuk Hapus)</th>
                      </tr>
                    </thead>
                    <tbody id="tbodyCMSList">
                      <tr><td colspan="3" class="text-center py-4"><div class="spinner-border text-success spinner-border-sm me-2"></div>Memuat konfigurasi...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light py-2 d-flex justify-content-between align-items-center">
            <div id="copyWarningText" class="text-muted" style="font-size: 0.78rem;"></div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-secondary px-3 fw-bold d-flex align-items-center gap-1 opacity-75 shadow-sm" id="btnCopyToClipboard" disabled>
                <i class="fa fa-copy"></i>
                <span id="btnCopyText">Copy to Clipboard</span>
              </button>
              <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    `;

    assignModalEl = document.createElement('div');
    assignModalEl.id = 'ztvAssignGroupModal';
    assignModalEl.className = 'modal fade';
    assignModalEl.tabIndex = -1;
    assignModalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow border-0 rounded-4">
          <div class="modal-header bg-primary text-white py-2">
            <h6 class="modal-title fw-bold m-0"><i class="fa fa-folder-open me-2"></i>Pilih Group Target</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-3">
            <div class="alert alert-info py-2 px-3 mb-2" style="font-size:0.8rem;">
              Parameter: <strong id="assignTargetParamName" class="text-dark"></strong>
            </div>
            <input type="text" id="inputFilterModalGroup" class="form-control form-control-sm mb-2" placeholder="Cari nama group...">
            <div class="list-group border rounded-3" id="listGroupSelections" style="max-height: 280px; overflow-y: auto;"></div>
          </div>
          <div class="modal-footer py-1 bg-light">
            <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Batal</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
    document.body.appendChild(assignModalEl);

    if (window.bootstrap && bootstrap.Modal) {
      new bootstrap.Modal(modalEl).show();
    } else {
      jQuery(modalEl).modal('show');
    }

    const extracted = extractTableData();
    let activeConfig = await fetchRemoteGroupingConfig();

    function renderCMSUI() {
      const currentSummary = calculateGroupedSummary(activeConfig, extracted.rawParamCounts);
      const tbodyCMS = document.getElementById('tbodyCMSList');
      const tbodyResult = document.getElementById('tbodyCMSResult');
      const tbodyOrg = document.getElementById('tbodyOrgResult');
      const filterText = (document.getElementById('inputFilterCMSGroup')?.value || '').toLowerCase().trim();

      tbodyOrg.innerHTML = '';
      MASTER_ORG_ROWS.forEach((item, index) => {
        let count = 0;
        item.prefixes.forEach(p => {
          if (extracted.orgCounts[p]) count += extracted.orgCounts[p];
        });

        const isHeaderOrEmpty = item.prefixes.length === 0;
        const tr = document.createElement('tr');
        if (isHeaderOrEmpty) tr.className = 'table-light text-muted';

        tr.innerHTML = `
          <td class="text-center fw-bold text-muted" style="font-size:0.75rem;">${index + 1}</td>
          <td class="${isHeaderOrEmpty ? 'fst-italic' : 'fw-bold text-dark'}" style="font-size:0.8rem;">${item.name}</td>
          <td class="text-center fw-bold ${count > 0 ? 'text-primary' : 'text-muted'}" style="font-size:0.85rem;">
            ${(!isHeaderOrEmpty && count > 0) ? count : '-'}
          </td>
        `;
        tbodyOrg.appendChild(tr);
      });

      tbodyResult.innerHTML = '';
      MASTER_GROUPS.forEach((group, index) => {
        const total = currentSummary.groupedResult[group];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-center text-muted" style="font-size: 0.75rem;">${index + 1}</td>
          <td style="font-size: 0.8rem; font-weight: 600;">${group}</td>
          <td class="text-center fw-bold ${total !== null ? 'text-success' : 'text-muted'}" style="font-size: 0.85rem;">
            ${total !== null ? total : '-'}
          </td>
        `;
        tbodyResult.appendChild(tr);
      });

      const unmappedKeys = Object.keys(currentSummary.unmapped);
      if (unmappedKeys.length > 0) {
        const trDivider = document.createElement('tr');
        trDivider.innerHTML = `<td colspan="3" class="bg-warning text-dark text-center fw-bold py-1" style="font-size:0.75rem;">PARAMETER BELUM TER-GROUP (${unmappedKeys.length})</td>`;
        tbodyResult.appendChild(trDivider);

        Object.entries(currentSummary.unmapped).forEach(([param, count]) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td colspan="2">
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-dark" style="font-size: 0.76rem;">${param}</span>
                <button type="button" class="btn btn-xs btn-outline-primary py-0 px-1 btn-open-assign-modal" style="font-size:0.68rem;" data-param="${param}">
                  + Masukkan Group
                </button>
              </div>
            </td>
            <td class="text-center text-muted fw-bold" style="font-size: 0.8rem;">${count}</td>
          `;
          tbodyResult.appendChild(tr);
        });
      }

      tbodyCMS.innerHTML = '';
      MASTER_GROUPS.forEach((group, index) => {
        if (filterText && !group.toLowerCase().includes(filterText)) return;

        const aliases = activeConfig[group] || [];
        const tr = document.createElement('tr');

        const aliasBadges = aliases.map(alias => `
          <span class="badge bg-light text-dark border me-1 mb-1 d-inline-flex align-items-center" style="font-size: 0.72rem; font-weight: 500;">
            ${alias}
            <button type="button" class="btn-close ms-1 btn-remove-alias" style="font-size: 0.5rem;" data-group="${group}" data-alias="${alias}" title="Hapus alias"></button>
          </span>
        `).join('');

        tr.innerHTML = `
          <td class="text-center text-muted fw-bold" style="font-size: 0.75rem;">${index + 1}</td>
          <td class="fw-bold text-success align-top" style="font-size: 0.8rem;">${group}</td>
          <td>
            <div class="d-flex flex-wrap align-items-center mb-1">
              ${aliasBadges || '<span class="text-muted fst-italic" style="font-size:0.72rem;">Belum ada alias terdaftar</span>'}
            </div>
            <button type="button" class="btn-xs btn-outline-primary py-0 px-2 btn-add-alias" style="font-size: 0.68rem;" data-group="${group}">
              + Tambah Alias
            </button>
          </td>
        `;
        tbodyCMS.appendChild(tr);
      });

      const btnCopyAll = document.getElementById('btnCopyToClipboard');
      const btnCopyText = document.getElementById('btnCopyText');
      const copyWarningText = document.getElementById('copyWarningText');

      if (unmappedKeys.length > 0) {
        btnCopyAll.disabled = true;
        btnCopyAll.className = 'btn btn-secondary px-3 fw-bold d-flex align-items-center gap-1 opacity-75 shadow-sm';
        btnCopyText.innerText = `Copy Terkunci (${unmappedKeys.length} Unmapped)`;
        copyWarningText.innerHTML = `<span class="text-danger fw-bold"><i class="fa fa-lock me-1"></i>Salin terkunci:</span> Ada <strong>${unmappedKeys.length} parameter</strong> belum dipetakan di tab <strong>Master Group List</strong>.`;
      } else {
        btnCopyAll.disabled = false;
        btnCopyAll.className = 'btn btn-success px-3 fw-bold d-flex align-items-center gap-1 shadow-sm';
        btnCopyText.innerText = `Copy to Clipboard`;
        copyWarningText.innerHTML = `<span class="text-success fw-bold"><i class="fa fa-check-circle me-1"></i>Siap disalin:</span> Semua parameter telah lengkap terpetakan.`;
      }
    }

    renderCMSUI();

    document.getElementById('inputFilterCMSGroup').addEventListener('input', () => {
      renderCMSUI();
    });

    document.getElementById('btnManualRefreshCloud').addEventListener('click', async () => {
      const icon = document.getElementById('iconRefreshCloud');
      if (icon) icon.classList.add('fa-spin');
      activeConfig = await fetchRemoteGroupingConfig();
      renderCMSUI();
      if (icon) icon.classList.remove('fa-spin');
    });

    modalEl.addEventListener('click', (e) => {
      const btnRemoveAlias = e.target.closest('.btn-remove-alias');
      if (btnRemoveAlias) {
        const group = btnRemoveAlias.getAttribute('data-group');
        const aliasToRemove = btnRemoveAlias.getAttribute('data-alias');
        if (activeConfig[group]) {
          activeConfig[group] = activeConfig[group].filter(a => a !== aliasToRemove);
          syncSaveGroupingConfig(activeConfig);
          renderCMSUI();
        }
      }
    });

    modalEl.addEventListener('click', (e) => {
      const btnAddAlias = e.target.closest('.btn-add-alias');
      if (btnAddAlias) {
        const group = btnAddAlias.getAttribute('data-group');
        const newAlias = prompt(`Masukkan nama alias baru untuk "${group}":\n(Gunakan koma jika lebih dari satu)`);
        if (newAlias && newAlias.trim()) {
          const toAdd = newAlias.split(',').map(s => s.trim()).filter(Boolean);
          activeConfig[group] = Array.from(new Set([...(activeConfig[group] || []), ...toAdd]));
          syncSaveGroupingConfig(activeConfig);
          renderCMSUI();
        }
      }
    });

    let selectedParamToAssign = '';
    modalEl.addEventListener('click', (e) => {
      const btnOpenAssign = e.target.closest('.btn-open-assign-modal');
      if (btnOpenAssign) {
        selectedParamToAssign = btnOpenAssign.getAttribute('data-param');
        document.getElementById('assignTargetParamName').innerText = selectedParamToAssign;
        document.getElementById('inputFilterModalGroup').value = '';

        renderAssignGroupList('');
        if (window.bootstrap && bootstrap.Modal) {
          new bootstrap.Modal(assignModalEl).show();
        } else {
          jQuery(assignModalEl).modal('show');
        }
      }
    });

    function renderAssignGroupList(keyword) {
      const listContainer = document.getElementById('listGroupSelections');
      listContainer.innerHTML = '';
      const filter = keyword.toLowerCase().trim();

      MASTER_GROUPS.forEach((group, index) => {
        if (filter && !group.toLowerCase().includes(filter)) return;

        const a = document.createElement('a');
        a.href = '#';
        a.className = 'list-group-item list-group-item-action py-1 px-3 d-flex justify-content-between align-items-center';
        a.style.fontSize = '0.78rem';
        a.innerHTML = `
          <span><strong>${index + 1}.</strong> ${group}</span>
          <span class="badge bg-primary rounded-pill">Pilih</span>
        `;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          activeConfig[group] = Array.from(new Set([...(activeConfig[group] || []), selectedParamToAssign]));
          syncSaveGroupingConfig(activeConfig);

          if (window.bootstrap && bootstrap.Modal) {
            bootstrap.Modal.getInstance(assignModalEl).hide();
          } else {
            jQuery(assignModalEl).modal('hide');
          }
          renderCMSUI();
        });
        listContainer.appendChild(a);
      });
    }

    document.getElementById('inputFilterModalGroup').addEventListener('input', (e) => {
      renderAssignGroupList(e.target.value);
    });

    document.getElementById('btnCopyToClipboard').addEventListener('click', async () => {
      const currentSummary = calculateGroupedSummary(activeConfig, extracted.rawParamCounts);
      if (Object.keys(currentSummary.unmapped).length > 0) return;

      const combinedVerticalData = [];

      let sumAllSamples = 0;
      MASTER_ORG_ROWS.forEach(item => {
        let count = 0;
        item.prefixes.forEach(p => {
          if (extracted.orgCounts[p]) count += extracted.orgCounts[p];
        });

        if (item.prefixes.length > 0) {
          sumAllSamples += count;
        }

        combinedVerticalData.push((item.prefixes.length > 0 && count > 0) ? String(count) : '');
      });

      for (let i = 1; i <= 18; i++) {
        if (i === 12) {
          combinedVerticalData.push(sumAllSamples > 0 ? String(sumAllSamples) : '');
        } else {
          combinedVerticalData.push('');
        }
      }

      let sumAllParams = 0;
      MASTER_GROUPS.forEach(group => {
        const val = currentSummary.groupedResult[group];
        if (val !== null && val !== undefined && typeof val === 'number') {
          sumAllParams += val;
        }
        combinedVerticalData.push((val !== null && val !== undefined) ? String(val) : '');
      });

      combinedVerticalData.push('');
      combinedVerticalData.push('');
      combinedVerticalData.push(sumAllParams > 0 ? String(sumAllParams) : '');

      const textToCopy = combinedVerticalData.join('\r\n') + '\r\n';
      const success = await copyStringToClipboard(textToCopy, modalEl);

      if (success) {
        const btnCopy = document.getElementById('btnCopyToClipboard');
        const originalHtml = btnCopy.innerHTML;
        btnCopy.className = 'btn btn-primary px-3 fw-bold d-flex align-items-center gap-1 shadow-sm';
        btnCopy.innerHTML = `<i class="fa fa-check"></i> Copied`;

        setTimeout(() => {
          btnCopy.className = 'btn btn-success px-3 fw-bold d-flex align-items-center gap-1 shadow-sm';
          btnCopy.innerHTML = originalHtml;
        }, 2500);
      }
    });
  }

  return {
    showModal
  };
})();