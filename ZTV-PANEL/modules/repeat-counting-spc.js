  // ==========================================
  // FITUR 4: LOGIC REPEAT COUNTING SPC (FALLBACK SYSTEM)
  // ==========================================
  function cleanupModalBlockers() {
    setTimeout(() => {
      const openModals = document.querySelectorAll('.modal.show, .modal[style*="display: block"]');
      if (openModals.length === 0) {
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.querySelectorAll('.swal2-container').forEach(el => {
          if (!el.classList.contains('swal2-shown')) el.remove();
        });

        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
        document.body.style.pointerEvents = 'auto';
        console.log('ZTV: Overlay pemblokir berhasil dibersihkan.');
      }
    }, 350);
  }

  function focusColonyInput() {
    let attempts = 0;
    const interval = setInterval(() => {
      const colonyInput = document.getElementById('inputColonyNoAnalisa');
      if (colonyInput && !colonyInput.disabled && colonyInput.offsetParent !== null) {
        clearInterval(interval);
        colonyInput.focus();
        colonyInput.select();
        console.log('ZTV: Kursor fokus ke Colony.');
      }
      attempts++;
      if (attempts > 30) clearInterval(interval);
    }, 100);
  }

  function openCountingModalByParam(paramName, callback) {
    cleanupModalBlockers();

    const modalEl = document.getElementById('modalInputResultParameter');
    if (modalEl && window.bootstrap && bootstrap.Modal.getInstance(modalEl)) {
      bootstrap.Modal.getInstance(modalEl).hide();
    }

    setTimeout(() => {
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');

      const btnAssist = document.querySelector(`button.btn-parameter-assist[data-parameter="${paramName}"]`);
      if (btnAssist) {
        btnAssist.click();
        console.log(`ZTV: Membuka modal dengan parameter [${paramName}]`);

        let attempts = 0;
        const interval = setInterval(() => {
          const inputNo = document.getElementById('inputNoAnalisaSearch');
          if (inputNo && inputNo.offsetParent !== null) {
            clearInterval(interval);
            if (typeof callback === 'function') callback(inputNo);
          }
          attempts++;
          if (attempts > 30) clearInterval(interval);
        }, 100);
      } else {
        console.warn(`ZTV: Tombol parameter [${paramName}] tidak ditemukan.`);
      }
    }, 350);
  }

  function reopenCountingModal() {
    openCountingModalByParam(currentSpcParameter, (inputNo) => {
      inputNo.focus();
      inputNo.select();
      console.log(`ZTV: Modal siap untuk No Analisa baru [${currentSpcParameter}].`);
    });
  }

  function triggerSpcFallback(noAnalisa) {
    if (isFallbackRunning) return;
    isFallbackRunning = true;

    const swalCloseBtn = document.querySelector('.swal2-confirm, .swal2-close');
    if (swalCloseBtn) swalCloseBtn.click();

    const fallbackParam = (currentSpcParameter === 'Standard plate count') ? 'SPC' : 'Standard plate count';
    console.log(`ZTV: No Analisa ${noAnalisa} tidak ditemukan di [${currentSpcParameter}]. Fallback ke [${fallbackParam}]...`);

    openCountingModalByParam(fallbackParam, (inputNo) => {
      inputNo.value = noAnalisa;
      inputNo.dispatchEvent(new Event('input', { bubbles: true }));
      inputNo.dispatchEvent(new Event('change', { bubbles: true }));

      const btnNext = document.getElementById('btnNextNoAnalisa');
      if (btnNext) {
        btnNext.click();

        setTimeout(() => {
          const detailDiv = document.getElementById('divNoAnalisaDetail');
          if (detailDiv && !detailDiv.classList.contains('d-none')) {
            currentSpcParameter = fallbackParam;
            console.log(`ZTV: Fallback sukses! Parameter aktif dialihkan ke [${currentSpcParameter}].`);
            focusColonyInput();
          } else {
            console.warn(`ZTV: No Analisa ${noAnalisa} tidak ditemukan baik di 'Standard plate count' maupun 'SPC'.`);
          }
          isFallbackRunning = false;
        }, 400);
      } else {
        isFallbackRunning = false;
      }
    });
  }

  function handleNextSearchValidation(noAnalisa) {
    let checkAttempts = 0;
    const checkInterval = setInterval(() => {
      checkAttempts++;
      const detailDiv = document.getElementById('divNoAnalisaDetail');
      const swalModal = document.querySelector('.swal2-modal');

      if (detailDiv && !detailDiv.classList.contains('d-none')) {
        clearInterval(checkInterval);
        focusColonyInput();
        return;
      }

      if (swalModal && swalModal.offsetParent !== null && !swalModal.classList.contains('swal2-hide')) {
        clearInterval(checkInterval);
        triggerSpcFallback(noAnalisa);
        return;
      }

      if (checkAttempts >= 12) {
        clearInterval(checkInterval);
        if (!detailDiv || detailDiv.classList.contains('d-none')) {
          triggerSpcFallback(noAnalisa);
        }
      }
    }, 100);
  }

  // Workflow Global Keyboard & Click Event
  if (!window._ztvModalWorkflowGlobalInit) {
    window._ztvModalWorkflowGlobalInit = true;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cleanupModalBlockers();
        return;
      }

      if (!isRepeatSPCEnabled || e.key !== 'Enter') return;

      const activeEl = document.activeElement;
      if (!activeEl) return;

      // STEP 1: Enter di input No Analisa / Select Parameter -> Trigger Next & Validasi Fallback
      if (activeEl.id === 'inputNoAnalisaSearch' || activeEl.id === 'selectParameterSearch') {
        e.preventDefault();
        const inputNoVal = document.getElementById('inputNoAnalisaSearch')?.value.trim();
        const btnNext = document.getElementById('btnNextNoAnalisa');

        if (btnNext && btnNext.offsetParent !== null && inputNoVal) {
          btnNext.click();
          handleNextSearchValidation(inputNoVal);
        }
        return;
      }

      // STEP 2: Enter di Colony / Dilution -> Trigger Submit
      if (activeEl.id === 'inputColonyNoAnalisa' || activeEl.id === 'inputDilutionNoAnalisa') {
        e.preventDefault();
        const btnSubmit = document.getElementById('btnSubmitNoAnalisaResult');
        if (btnSubmit && btnSubmit.offsetParent !== null) {
          btnSubmit.click();
          console.log('ZTV: Enter ditekan -> Submit data.');
        }
        return;
      }
    });

    document.addEventListener('click', (e) => {
      const isCloseBtn = e.target.closest('[data-bs-dismiss="modal"], [data-dismiss="modal"], .btn-close, .modal .close');
      if (isCloseBtn) {
        cleanupModalBlockers();
      }

      if (!isRepeatSPCEnabled) return;

      const targetSwal = e.target.closest('button.swal2-confirm');
      if (targetSwal) {
        const swalContainer = targetSwal.closest('.swal2-container');
        const isSuccess = swalContainer?.querySelector('.swal2-success') !== null;

        if (isSuccess) {
          console.log('ZTV: Submit sukses terkonfirmasi, membuka modal SPC selanjutnya.');
          reopenCountingModal();
        }
      }
    });
  }