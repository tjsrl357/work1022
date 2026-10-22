/**
 * 메인 애플리케이션 진입점 및 이벤트 리스너 바인딩
 */
document.addEventListener('DOMContentLoaded', function () {
  // 1. 기본 샘플 데이터로 초기화
  DashboardController.init(DEFAULT_SAMPLE_DATA);

  // 2. 파일 업로드 요소
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const btnUploadTrigger = document.getElementById('btnUploadTrigger');
  const uploadFeedback = document.getElementById('uploadFeedback');
  const btnResetSample = document.getElementById('btnResetSample');

  // 파일 선택 트리거
  if (btnUploadTrigger && fileInput) {
    btnUploadTrigger.addEventListener('click', () => fileInput.click());
  }
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', (e) => {
      if (e.target !== btnResetSample && !e.target.closest('#btnResetSample') && !e.target.closest('.btn-download-template')) {
        fileInput.click();
      }
    });
  }

  // 드래그 앤 드롭 효과
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-active');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    });
  }

  // 파일 인풋 변경
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });
  }

  /**
   * 업로드된 파일 읽기 및 파싱 처리
   */
  function handleFile(file) {
    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();

    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      showToast('❌ 지원하지 않는 형식입니다. .xlsx, .xls, .csv 파일을 업로드해주세요.', 'error');
      return;
    }

    const reader = new FileReader();

    if (ext === 'csv') {
      reader.onload = function (e) {
        try {
          const content = e.target.result;
          const parsed = BudgetDataParser.parseData(content, 'csv');
          DashboardController.loadDataset(parsed);
          showToast(`✅ "${fileName}" 파싱 완료! 총 ${parsed.length}개 사업이 로드되었습니다.`, 'success');
          updateFileInfoBadge(fileName, parsed.length);
        } catch (err) {
          console.error(err);
          showToast(`⚠️ 파싱 실패: ${err.message}`, 'error');
        }
      };
      reader.readAsText(file, 'utf-8');
    } else {
      reader.onload = function (e) {
        try {
          const data = new Uint8Array(e.target.result);
          const parsed = BudgetDataParser.parseData(data, 'excel');
          DashboardController.loadDataset(parsed);
          showToast(`✅ "${fileName}" 엑셀 파싱 완료! 총 ${parsed.length}개 사업 로드됨`, 'success');
          updateFileInfoBadge(fileName, parsed.length);
        } catch (err) {
          console.error(err);
          showToast(`⚠️ 엑셀 파싱 실패: ${err.message}`, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function updateFileInfoBadge(fileName, count) {
    if (uploadFeedback) {
      uploadFeedback.innerHTML = `
        <div class="loaded-file-badge">
          <i data-lucide="file-spreadsheet"></i>
          <span><strong>${fileName}</strong> (${count}개 사업 반영됨)</span>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  // 3. 샘플 데이터 복원
  if (btnResetSample) {
    btnResetSample.addEventListener('click', (e) => {
      e.stopPropagation();
      DashboardController.loadDataset(DEFAULT_SAMPLE_DATA);
      if (uploadFeedback) uploadFeedback.innerHTML = '';
      if (fileInput) fileInput.value = '';
      showToast('기본 2027 국방예산 샘플 데이터로 복원되었습니다.', 'info');
    });
  }

  // 4. 신규 사업 전용 토글
  const filterOnlyNew = document.getElementById('filterOnlyNew');
  if (filterOnlyNew) {
    filterOnlyNew.addEventListener('change', (e) => {
      DashboardController.setOnlyNew(e.target.checked);
    });
  }

  // 5. 검색창 실시간 필터링 (디바운스)
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        DashboardController.setSearchKeyword(e.target.value);
      }, 200);
    });
  }

  // 6. 테이블 헤더 클릭 시 정렬
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', function () {
      const sortKey = this.getAttribute('data-sort');
      DashboardController.setSort(sortKey);
      
      // UI 화살표 클래스 갱신
      document.querySelectorAll('th[data-sort]').forEach(el => el.classList.remove('sort-asc', 'sort-desc'));
      const state = DashboardController.getState();
      this.classList.add(state.sortAsc ? 'sort-asc' : 'sort-desc');
    });
  });

  // 7. 상위 랭킹 차트 모드 전환 (증감액 vs 증가율)
  const btnRankDiff = document.getElementById('btnRankDiff');
  const btnRankRate = document.getElementById('btnRankRate');
  if (btnRankDiff && btnRankRate) {
    btnRankDiff.addEventListener('click', () => {
      btnRankDiff.classList.add('active');
      btnRankRate.classList.remove('active');
      DashboardController.setTopChartMode('diff');
    });
    btnRankRate.addEventListener('click', () => {
      btnRankRate.classList.add('active');
      btnRankDiff.classList.remove('active');
      DashboardController.setTopChartMode('rate');
    });
  }

  // 8. 엑셀 내보내기 버튼 이벤트 연결
  const btnExportExcel = document.getElementById('btnExportExcel');
  const btnTableExportFiltered = document.getElementById('btnTableExportFiltered');
  const btnTableExportAll = document.getElementById('btnTableExportAll');

  // 상단 헤더 엑셀 내보내기 (현재 조회 목록 기준)
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
      const count = DashboardController.exportToExcel(false);
      if (count > 0) {
        showToast(`📊 현재 조회된 ${count}개 사업 데이터가 엑셀로 저장되었습니다.`, 'success');
      }
    });
  }

  // 테이블 툴바: 현재 목록 엑셀 저장
  if (btnTableExportFiltered) {
    btnTableExportFiltered.addEventListener('click', () => {
      const count = DashboardController.exportToExcel(false);
      if (count > 0) {
        showToast(`📊 현재 필터링된 ${count}개 사업 데이터가 엑셀로 저장되었습니다.`, 'success');
      }
    });
  }

  // 테이블 툴바: 전체 사업 엑셀 저장
  if (btnTableExportAll) {
    btnTableExportAll.addEventListener('click', () => {
      const count = DashboardController.exportToExcel(true);
      if (count > 0) {
        showToast(`📊 전체 사업 데이터 총 ${count}건이 엑셀로 저장되었습니다.`, 'success');
      }
    });
  }

  // 9. 모달 닫기
  const modal = document.getElementById('detailModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalBackdrop = document.querySelector('.modal-backdrop');
  if (btnCloseModal) btnCloseModal.addEventListener('click', () => DashboardController.closeModal());
  if (modalBackdrop) modalBackdrop.addEventListener('click', () => DashboardController.closeModal());
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') DashboardController.closeModal();
  });

  // 10. 다크/라이트 테마 토글
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      btnThemeToggle.innerHTML = isDark 
        ? '<i data-lucide="sun"></i> 라이트모드' 
        : '<i data-lucide="moon"></i> 다크모드';
      if (window.lucide) lucide.createIcons();
    });
  }

  /**
   * 토스트 메시지 알림 팝업
   */
  function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
});
