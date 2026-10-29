(async function() {
  'use strict';

  const GITHUB_USER = 'mzackasys';
  const GITHUB_REPO = 'ztv-panel';
  const BASE_URL = 'https://raw.githubusercontent.com/' + GITHUB_USER + '/' + GITHUB_REPO + '/main/ZTV-PANEL/modules/';
  const cacheBust = '?t=' + Date.now();

  const moduleFiles = [
    'brecal.js',
    'reset-dilution.js',
    'batas-shift.js',
    'show-1000.js',
    'hide-columns.js',
    'sticky-highlight.js',
    'repeat-counting-spc.js'
  ];

  async function loadExternalModule(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' (' + response.statusText + ') saat memuat: ' + url);
    }
    const rawText = await response.text();
    const cleanCode = rawText.replace(/^\uFEFF/, '');
    
    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([cleanCode], { type: 'text/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        const script = document.createElement('script');
        script.src = blobUrl;
        script.onload = () => {
          URL.revokeObjectURL(blobUrl);
          script.remove();
          resolve();
        };
        script.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          script.remove();
          reject(new Error('Gagal mengeksekusi script modul: ' + url));
        };
        (document.head || document.documentElement).appendChild(script);
      } catch (err) {
        reject(err);
      }
    });
  }

  try {
    await Promise.all(moduleFiles.map(file => loadExternalModule(BASE_URL + file + cacheBust)));
    console.log('%c[ZTV Suite] ✅ Seluruh modul fitur berhasil dimuat.', 'color: #198754; font-weight: bold;');
  } catch (err) {
    console.error('[ZTV Suite] ❌ Terjadi kesalahan saat memuat modul:', err);
    return;
  }

  let isResetEnabled = false;
  let isShiftEnabled = false;
  let isShow1000Enabled = false;
  let isHideTSEnabled = false;
  let isHidePoolingEnabled = false;
  let isHidePendinganEnabled = false;
  let isStickyHighlightEnabled = false;
  let isRepeatSPCEnabled = false;

  function updateBreCalButtonState() {
    const btnCalculate = document.getElementById('btnZtvBreCalCalculate');
    if (!btnCalculate) return;

    const prepTabBtn = document.getElementById('prep-analysis-tab');
    const isPrepActive = prepTabBtn && (
      prepTabBtn.classList.contains('active') ||
      prepTabBtn.getAttribute('aria-selected') === 'true'
    );

    if (isPrepActive) {
      btnCalculate.disabled = false;
      btnCalculate.className = 'btn btn-sm btn-success fw-bold shadow-sm';
      btnCalculate.style.cssText = 'font-size: 0.75rem; padding: 0.2rem 0.55rem; cursor: pointer;';
    } else {
      btnCalculate.disabled = true;
      btnCalculate.className = 'btn btn-sm btn-secondary fw-bold';
      btnCalculate.style.cssText = 'font-size: 0.75rem; padding: 0.2rem 0.55rem; cursor: not-allowed; opacity: 0.65;';
    }
  }

  function injectZTVPanel() {
    const existingMenu = document.getElementById('ztvZakiFolderItem');
    if (existingMenu) {
      updateBreCalButtonState();
      return;
    }

    const lisaFolderLi =
      document.querySelector('li.menu-item[data-menu="825"]') ||
      (() => {
        const el = document.querySelector('[data-i18n="Lisa"]');
        return el ? (el.closest('li.menu-item.ini-menus') || el.closest('li.menu-item')) : null;
      })();

    if (!lisaFolderLi) return;

    const zakiFolderLi = document.createElement('li');
    zakiFolderLi.id = 'ztvZakiFolderItem';
    zakiFolderLi.className = 'menu-item ini-menus';
    zakiFolderLi.setAttribute('data-menu', 'ztv-zaki');
    zakiFolderLi.setAttribute('data-ztv-open', 'false');

    const zakiToggleLink = document.createElement('a');
    zakiToggleLink.className = 'menu-link menu-toggle ztv-folder-toggle';
    zakiToggleLink.href = 'javascript:void(0);';
    zakiToggleLink.innerHTML = '<i class="menu-icon tf-icons ti ti-flame" style="color: #ff5722; font-size: 1.25rem;"></i><div data-i18n="Zaki">Zaki&nbsp;</div>';

    const zakiSubmenuUl = document.createElement('ul');
    zakiSubmenuUl.className = 'menu-sub ini-child';
    zakiSubmenuUl.style.cssText = 'display: none !important; padding: 0.5rem 0.75rem;';

    zakiToggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const isOpen = zakiFolderLi.getAttribute('data-ztv-open') === 'true';

      if (isOpen) {
        zakiFolderLi.setAttribute('data-ztv-open', 'false');
        zakiFolderLi.classList.remove('open', 'active');
        zakiSubmenuUl.style.setProperty('display', 'none', 'important');
      } else {
        zakiFolderLi.setAttribute('data-ztv-open', 'true');
        zakiFolderLi.classList.add('open', 'active');
        zakiSubmenuUl.style.setProperty('display', 'block', 'important');
      }
    });

    const boxContainer = document.createElement('div');
    boxContainer.id = 'ztvCustomPanelContainer';
    boxContainer.style.cssText = 'background-color: #d1e7dd; border: 1px solid #a3cfbb; border-radius: 0.5rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.45rem; width: 100%;';

    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'color: #0f5132; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; text-align: center; width: 100%; margin-bottom: 0.2rem;';
    titleDiv.innerHTML = '<span>ZTV PANEL 🔥</span>';

    function createSwitchRow(id, labelText, isChecked, onChangeCallback) {
      const switchDiv = document.createElement('div');
      switchDiv.className = 'form-check form-switch m-0 d-flex align-items-center justify-content-between';
      switchDiv.style.cssText = 'padding: 0.35rem 0.5rem; background: rgba(255,255,255,0.4); border-radius: 0.35rem;';

      const switchLabel = document.createElement('label');
      switchLabel.className = 'form-check-label fw-bold text-dark';
      switchLabel.htmlFor = id;
      switchLabel.innerText = labelText;
      switchLabel.style.cssText = 'font-size: 0.75rem; cursor: pointer; user-select: none; margin-bottom: 0; white-space: nowrap;';

      const switchInput = document.createElement('input');
      switchInput.className = 'form-check-input m-0';
      switchInput.type = 'checkbox';
      switchInput.role = 'switch';
      switchInput.id = id;
      switchInput.checked = isChecked;
      switchInput.style.cssText = 'cursor: pointer; float: none;';

      switchInput.addEventListener('change', (e) => {
        onChangeCallback(e.target.checked);
      });

      switchDiv.appendChild(switchLabel);
      switchDiv.appendChild(switchInput);
      return switchDiv;
    }

    const breCalRow = document.createElement('div');
    breCalRow.className = 'd-flex align-items-center justify-content-between';
    breCalRow.style.cssText = 'padding: 0.35rem 0.5rem; background: rgba(255,255,255,0.6); border-radius: 0.35rem; border: 1px solid rgba(15, 81, 50, 0.2);';

    const breCalLabel = document.createElement('span');
    breCalLabel.className = 'fw-bold text-dark';
    breCalLabel.style.cssText = 'font-size: 0.75rem; user-select: none;';
    breCalLabel.innerHTML = '<i class="fa fa-calculator text-success me-1"></i>BreCal';

    const btnCalculate = document.createElement('button');
    btnCalculate.type = 'button';
    btnCalculate.id = 'btnZtvBreCalCalculate';
    btnCalculate.innerText = 'Calculate';
    btnCalculate.addEventListener('click', () => {
      if (window.ZTV_MODULES && window.ZTV_MODULES.brecal) {
        window.ZTV_MODULES.brecal.showModal();
      }
    });

    breCalRow.appendChild(breCalLabel);
    breCalRow.appendChild(btnCalculate);

    const switchResetRow = createSwitchRow('switchResetDill', 'Reset Dilution', isResetEnabled, (checked) => {
      isResetEnabled = checked;
      if (window.ZTV_MODULES && window.ZTV_MODULES.resetDilution) {
        if (isResetEnabled) window.ZTV_MODULES.resetDilution.enable();
        else window.ZTV_MODULES.resetDilution.disable();
      }
    });

    const switchShiftRow = createSwitchRow('switchBatasShift', 'Batas Shift', isShiftEnabled, (checked) => {
      isShiftEnabled = checked;
      if (window.ZTV_MODULES && window.ZTV_MODULES.batasShift) {
        if (isShiftEnabled) window.ZTV_MODULES.batasShift.enable(() => isShiftEnabled);
        else window.ZTV_MODULES.batasShift.disable();
      }
    });

    const switchRepeatSPCRow = createSwitchRow('switchRepeatSPC', 'Repeat Counting SPC', isRepeatSPCEnabled, (checked) => {
      isRepeatSPCEnabled = checked;
      if (window.ZTV_MODULES && window.ZTV_MODULES.repeatCountingSPC) {
        if (isRepeatSPCEnabled) window.ZTV_MODULES.repeatCountingSPC.enable();
        else window.ZTV_MODULES.repeatCountingSPC.disable();
      }
    });

    const switchShow1000Row = createSwitchRow('switchShow1000', 'Show 1000 data', isShow1000Enabled, (checked) => {
      isShow1000Enabled = checked;
      if (window.ZTV_MODULES && window.ZTV_MODULES.show1000) {
        window.ZTV_MODULES.show1000.apply(isShow1000Enabled ? 1000 : 10);
      }
    });

    const switchStickyHighlightRow = createSwitchRow('switchStickyHighlight', 'Sticky Highlight', isStickyHighlightEnabled, (checked) => {
      isStickyHighlightEnabled = checked;
      if (window.ZTV_MODULES && window.ZTV_MODULES.stickyHighlight) {
        if (isStickyHighlightEnabled) window.ZTV_MODULES.stickyHighlight.enable();
        else window.ZTV_MODULES.stickyHighlight.disable();
      }
    });

    const switchHideTSRow = createSwitchRow('switchHideTS', 'Prep : Hide T.S', isHideTSEnabled, (checked) => {
      isHideTSEnabled = checked;
      if (window.ZTV_MODULES && window.ZTV_MODULES.hideColumns) {
        window.ZTV_MODULES.hideColumns.toggle('titik', isHideTSEnabled);
      }
    });

    const switchHidePoolingRow = createSwitchRow('switchHidePooling', 'Prep : Hide Pooling', isHidePoolingEnabled, (checked) => {
      isHidePoolingEnabled = checked;
      if (window.ZTV_MODULES && window.ZTV_MODULES.hideColumns) {
        window.ZTV_MODULES.hideColumns.toggle('pooling no', isHidePoolingEnabled);
      }
    });

    const switchHidePendinganRow = createSwitchRow('switchHidePendingan', 'Prep : Hide Pendingan', isHidePendinganEnabled, (checked) => {
      isHidePendinganEnabled = checked;
      if (window.ZTV_MODULES && window.ZTV_MODULES.hideColumns) {
        window.ZTV_MODULES.hideColumns.toggle('pendingan', isHidePendinganEnabled);
      }
    });

    boxContainer.appendChild(titleDiv);
    boxContainer.appendChild(breCalRow);
    boxContainer.appendChild(switchResetRow);
    boxContainer.appendChild(switchShiftRow);
    boxContainer.appendChild(switchRepeatSPCRow);
    boxContainer.appendChild(switchShow1000Row);
    boxContainer.appendChild(switchStickyHighlightRow);
    boxContainer.appendChild(switchHideTSRow);
    boxContainer.appendChild(switchHidePoolingRow);
    boxContainer.appendChild(switchHidePendinganRow);

    zakiSubmenuUl.appendChild(boxContainer);
    zakiFolderLi.appendChild(zakiToggleLink);
    zakiFolderLi.appendChild(zakiSubmenuUl);

    lisaFolderLi.insertAdjacentElement('afterend', zakiFolderLi);
    updateBreCalButtonState();
  }

  document.addEventListener('shown.bs.tab', () => {
    updateBreCalButtonState();
  });

  setInterval(() => {
    injectZTVPanel();
    updateBreCalButtonState();

    if (window.ZTV_MODULES) {
      if (isResetEnabled && window.ZTV_MODULES.resetDilution) {
        window.ZTV_MODULES.resetDilution.enable();
      }
      if (isShiftEnabled && window.ZTV_MODULES.batasShift) {
        window.ZTV_MODULES.batasShift.refresh(() => isShiftEnabled);
      }
      if (isShow1000Enabled && window.ZTV_MODULES.show1000) {
        window.ZTV_MODULES.show1000.apply(1000);
      }
      if (isStickyHighlightEnabled && window.ZTV_MODULES.stickyHighlight) {
        window.ZTV_MODULES.stickyHighlight.enable();
      }
    }
  }, 500);

  const observer = new MutationObserver(() => {
    injectZTVPanel();
    updateBreCalButtonState();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  injectZTVPanel();
})();