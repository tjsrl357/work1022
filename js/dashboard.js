/**
 * 대시보드 UI 및 상태 관리 컨트롤러
 */
const DashboardController = (function () {
  let state = {
    allData: [],
    filteredData: [],
    selectedCategory: 'ALL',
    onlyNew: false,
    searchKeyword: '',
    sortKey: 'id',
    sortAsc: true,
    topChartMode: 'diff' // 'diff' | 'rate'
  };

  /**
   * 숫자 단위 포맷 (조, 억원 단위 보기 쉽게 변환)
   */
  function formatAmount(num) {
    if (num === null || num === undefined || isNaN(num)) return '0억원';
    const abs = Math.abs(num);
    if (abs >= 10000) {
      const jo = Math.floor(abs / 10000);
      const eok = Math.round(abs % 10000);
      const sign = num < 0 ? '-' : '';
      return eok > 0 ? `${sign}${jo}조 ${eok.toLocaleString()}억원` : `${sign}${jo}조원`;
    }
    return `${num.toLocaleString()}억원`;
  }

  /**
   * 초기화 및 데이터 주입
   */
  function init(initialData) {
    state.allData = [...initialData];
    applyFiltersAndRender();
  }

  /**
   * 새 데이터셋 로드
   */
  function loadDataset(newData) {
    state.allData = [...newData];
    state.selectedCategory = 'ALL';
    state.onlyNew = false;
    state.searchKeyword = '';
    applyFiltersAndRender();
  }

  /**
   * 필터 및 검색 적용 후 전체 화면 갱신
   */
  function applyFiltersAndRender() {
    let result = [...state.allData];

    // 1. 카테고리 필터
    if (state.selectedCategory !== 'ALL') {
      result = result.filter(item => item.category === state.selectedCategory);
    }

    // 2. 신규 사업 전용 필터
    if (state.onlyNew) {
      result = result.filter(item => item.isNew);
    }

    // 3. 검색어 필터 (사업명, 분야, 핵심내용 검색)
    if (state.searchKeyword.trim() !== '') {
      const q = state.searchKeyword.trim().toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q)
      );
    }

    // 4. 정렬
    result.sort((a, b) => {
      let valA = a[state.sortKey];
      let valB = b[state.sortKey];
      if (typeof valA === 'string') {
        return state.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return state.sortAsc ? (valA - valB) : (valB - valA);
    });

    state.filteredData = result;

    // UI 모듈 렌더링
    renderKpiCards();
    renderCategoryTabs();
    renderCategoryCards();
    renderTable();
    
    // 차트 업데이트 (차트는 필터링된 데이터셋 기준으로 갱신)
    const chartData = state.filteredData.length > 0 ? state.filteredData : state.allData;
    DashboardCharts.renderAll(chartData, state.topChartMode);

    // Lucide 아이콘 리프레시
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  /**
   * 상단 글로벌 KPI 카드 렌더링
   */
  function renderKpiCards() {
    const data = state.allData; // KPI는 전체 현황 기준
    const totalPrev = data.reduce((acc, item) => acc + item.prevAmount, 0);
    const totalCurr = data.reduce((acc, item) => acc + item.currAmount, 0);
    const totalDiff = totalCurr - totalPrev;
    const totalRate = totalPrev > 0 ? Math.round((totalDiff / totalPrev) * 1000) / 10 : 0;

    const newProjects = data.filter(item => item.isNew);
    const newCount = newProjects.length;
    const newTotalAmount = newProjects.reduce((acc, item) => acc + item.currAmount, 0);

    // 분야별 집계 중 최대 증액 분야 찾기
    const categories = DashboardCharts.aggregateByCategory(data);
    let topCategory = null;
    if (categories.length > 0) {
      topCategory = [...categories].sort((a, b) => b.diffTotal - a.diffTotal)[0];
    }

    // DOM 업데이트
    const elCurrTotal = document.getElementById('kpiCurrTotal');
    const elPrevTotal = document.getElementById('kpiPrevTotal');
    const elDiffAmount = document.getElementById('kpiDiffAmount');
    const elDiffRate = document.getElementById('kpiDiffRate');
    const elProjectCount = document.getElementById('kpiProjectCount');
    const elNewCount = document.getElementById('kpiNewCount');
    const elNewBudget = document.getElementById('kpiNewBudget');
    const elTopCatName = document.getElementById('kpiTopCatName');
    const elTopCatAmount = document.getElementById('kpiTopCatAmount');

    if (elCurrTotal) elCurrTotal.textContent = formatAmount(totalCurr);
    if (elPrevTotal) elPrevTotal.textContent = `기준년도: ${formatAmount(totalPrev)}`;
    if (elDiffAmount) elDiffAmount.textContent = `+${formatAmount(totalDiff)}`;
    if (elDiffRate) {
      elDiffRate.textContent = `+${totalRate}% 증액`;
      elDiffRate.className = totalDiff >= 0 ? 'kpi-badge badge-up' : 'kpi-badge badge-down';
    }
    if (elProjectCount) elProjectCount.textContent = `${data.length}개 사업`;
    if (elNewCount) elNewCount.textContent = `신규 사업 ${newCount}건`;
    if (elNewBudget) elNewBudget.textContent = `신규 예산: ${formatAmount(newTotalAmount)}`;
    if (elTopCatName && topCategory) {
      elTopCatName.textContent = topCategory.name;
    }
    if (elTopCatAmount && topCategory) {
      elTopCatAmount.textContent = `+${formatAmount(topCategory.diffTotal)} 증액`;
    }
  }

  /**
   * 분야별 필터 탭 렌더링
   */
  function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    if (!container) return;

    const categories = DashboardCharts.aggregateByCategory(state.allData);
    
    let html = `
      <button class="filter-tab ${state.selectedCategory === 'ALL' ? 'active' : ''}" data-cat="ALL">
        전체 보기 <span class="tab-count">${state.allData.length}</span>
      </button>
    `;

    categories.forEach(cat => {
      const isActive = state.selectedCategory === cat.name;
      html += `
        <button class="filter-tab ${isActive ? 'active' : ''}" data-cat="${encodeURIComponent(cat.name)}">
          ${cat.name} <span class="tab-count">${cat.count}</span>
        </button>
      `;
    });

    container.innerHTML = html;

    // 이벤트 바인딩
    container.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', function () {
        const cat = decodeURIComponent(this.getAttribute('data-cat'));
        state.selectedCategory = cat;
        applyFiltersAndRender();
      });
    });
  }

  /**
   * 분야별 핵심 요약 카드 그리드 렌더링
   */
  function renderCategoryCards() {
    const container = document.getElementById('categoryCardsGrid');
    if (!container) return;

    const categories = DashboardCharts.aggregateByCategory(state.allData);
    let html = '';

    categories.forEach(cat => {
      const isSelected = state.selectedCategory === cat.name;
      const rate = cat.prevTotal > 0 ? Math.round(((cat.currTotal - cat.prevTotal) / cat.prevTotal) * 1000) / 10 : 0;
      
      html += `
        <div class="category-summary-card ${isSelected ? 'selected' : ''}" data-cat="${encodeURIComponent(cat.name)}">
          <div class="card-top">
            <h4 class="cat-title" title="${cat.name}">${cat.name}</h4>
            <span class="cat-badge ${rate >= 0 ? 'badge-up' : 'badge-down'}">
              ${rate >= 0 ? '+' : ''}${rate}%
            </span>
          </div>
          <div class="card-budget">
            <span class="budget-label">2027 예산</span>
            <span class="budget-val">${formatAmount(cat.currTotal)}</span>
          </div>
          <div class="card-footer">
            <span>사업 ${cat.count}건</span>
            ${cat.newCount > 0 ? `<span class="new-pill"><i data-lucide="sparkles"></i> 신규 ${cat.newCount}건</span>` : '<span class="text-muted">기존 사업</span>'}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // 카드 클릭 시 해당 분야 선택 토글
    container.querySelectorAll('.category-summary-card').forEach(card => {
      card.addEventListener('click', function () {
        const cat = decodeURIComponent(this.getAttribute('data-cat'));
        if (state.selectedCategory === cat) {
          state.selectedCategory = 'ALL';
        } else {
          state.selectedCategory = cat;
        }
        applyFiltersAndRender();
      });
    });
  }

  /**
   * 데이터 테이블 렌더링
   */
  function renderTable() {
    const tbody = document.getElementById('tableBody');
    const countEl = document.getElementById('tableRowCount');
    if (!tbody) return;

    const data = state.filteredData;
    if (countEl) countEl.textContent = `검색 결과 ${data.length}건`;

    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <i data-lucide="inbox"></i>
            <p>조건에 부합하는 사업 내역이 없습니다.</p>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    data.forEach(item => {
      const isUp = item.diffAmount >= 0;
      const rateBadge = item.isNew 
        ? `<span class="badge-new-pill">NEW 신규</span>`
        : `<span class="rate-badge ${isUp ? 'badge-up' : 'badge-down'}">${isUp ? '+' : ''}${item.diffRate}%</span>`;

      html += `
        <tr class="table-row ${item.isNew ? 'row-new' : ''}" data-id="${item.id}">
          <td class="col-center text-muted">${item.id}</td>
          <td class="col-cat"><span class="cat-tag">${item.category}</span></td>
          <td class="col-title">
            <div class="title-wrap">
              <strong>${item.title}</strong>
              ${item.isNew ? '<span class="badge-new-inline">신규</span>' : ''}
            </div>
          </td>
          <td class="col-num">${item.prevAmount.toLocaleString()}</td>
          <td class="col-num font-bold highlight-cell">${item.currAmount.toLocaleString()}</td>
          <td class="col-num ${isUp ? 'text-up' : 'text-down'}">${isUp ? '+' : ''}${item.diffAmount.toLocaleString()}</td>
          <td class="col-center">${rateBadge}</td>
          <td class="col-details">
            <div class="details-snippet" title="${item.details}">
              ${item.details}
            </div>
            <button class="btn-detail-view" data-id="${item.id}">근거보기</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    // 행 및 버튼 클릭 이벤트 바인딩 (모달 열기)
    tbody.querySelectorAll('.table-row, .btn-detail-view').forEach(elem => {
      elem.addEventListener('click', function (e) {
        const id = this.getAttribute('data-id');
        const item = state.allData.find(d => String(d.id) === String(id));
        if (item) {
          openDetailModal(item);
        }
      });
    });
  }

  /**
   * 상세 모달 오픈
   */
  function openDetailModal(item) {
    const modal = document.getElementById('detailModal');
    if (!modal) return;

    document.getElementById('modalCategory').textContent = item.category;
    document.getElementById('modalTitle').textContent = item.title;
    
    const badgeWrap = document.getElementById('modalBadgeWrap');
    if (item.isNew) {
      badgeWrap.innerHTML = '<span class="badge-new-pill">✨ 2027년도 신규 추진 사업</span>';
    } else {
      badgeWrap.innerHTML = `<span class="rate-badge badge-up">전년 대비 +${item.diffRate}% 증액</span>`;
    }

    document.getElementById('modalPrevAmount').textContent = `${item.prevAmount.toLocaleString()} 억원`;
    document.getElementById('modalCurrAmount').textContent = `${item.currAmount.toLocaleString()} 억원`;
    document.getElementById('modalDiffAmount').textContent = `+${item.diffAmount.toLocaleString()} 억원`;
    document.getElementById('modalUnit').textContent = item.unit || '억원';
    document.getElementById('modalDetailsText').textContent = item.details || '상세 보도자료 내용이 없습니다.';

    modal.classList.add('open');
  }

  /**
   * 모달 닫기
   */
  function closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) modal.classList.remove('open');
  }

  /**
   * 사업 데이터 엑셀 내보내기 (SheetJS)
   * @param {boolean} exportAll - true면 전체 사업 데이터, false면 현재 필터/검색된 목록 저장
   */
  function exportToExcel(exportAll = false) {
    if (typeof XLSX === 'undefined') {
      alert('엑셀 내보내기 라이브러리가 준비되지 않았습니다.');
      return 0;
    }

    const targetList = exportAll ? state.allData : state.filteredData;
    if (!targetList || targetList.length === 0) {
      alert('내보낼 사업 데이터가 없습니다.');
      return 0;
    }

    const exportRows = targetList.map((item, idx) => ({
      '연번': item.id || (idx + 1),
      '분야 (중점영역)': item.category,
      '세부 사업 / 주요 지표': item.title,
      '구분/단위': item.unit || '억원',
      '2026년 (A)': item.prevAmount,
      '2027년 정부안 (B)': item.currAmount,
      '증감 (B-A)': item.diffAmount,
      '증가율 (%)': item.isNew ? '신규' : `${item.diffRate}%`,
      '핵심 내용 및 보도자료 박스 원문 근거': item.details
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);

    // 열 너비 자동 설정 (컬럼 가독성 극대화)
    ws['!cols'] = [
      { wch: 8 },  // 연번
      { wch: 26 }, // 분야 (중점영역)
      { wch: 36 }, // 세부 사업 / 주요 지표
      { wch: 10 }, // 구분/단위
      { wch: 14 }, // 2026년 (A)
      { wch: 16 }, // 2027년 정부안 (B)
      { wch: 14 }, // 증감 (B-A)
      { wch: 12 }, // 증가율 (%)
      { wch: 65 }  // 핵심 내용 및 보도자료 박스 원문 근거
    ];

    const wb = XLSX.utils.book_new();
    const sheetTitle = exportAll ? '전체사업목록' : '조회사업목록';
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = exportAll ? '전체사업목록' : '조회결과목록';
    const fileName = `2027국방예산_${prefix}_${nowStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    return targetList.length;
  }

  return {
    init: init,
    loadDataset: loadDataset,
    setCategory: function (cat) {
      state.selectedCategory = cat;
      applyFiltersAndRender();
    },
    setOnlyNew: function (val) {
      state.onlyNew = val;
      applyFiltersAndRender();
    },
    setSearchKeyword: function (kw) {
      state.searchKeyword = kw;
      applyFiltersAndRender();
    },
    setSort: function (key) {
      if (state.sortKey === key) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortKey = key;
        state.sortAsc = false; // 기본 내림차순 (금액 등 높은순)
      }
      applyFiltersAndRender();
    },
    setTopChartMode: function (mode) {
      state.topChartMode = mode;
      DashboardCharts.renderAll(
        state.filteredData.length > 0 ? state.filteredData : state.allData, 
        state.topChartMode
      );
    },
    closeModal: closeModal,
    exportToExcel: exportToExcel,
    getState: function () { return state; }
  };
})();
