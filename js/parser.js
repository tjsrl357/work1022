/**
 * 엑셀(XLSX/XLS) 및 CSV 파서 모듈 (SheetJS 기반)
 */
const BudgetDataParser = (function () {
  /**
   * 문자열이나 숫자를 안전하게 실수로 변환
   */
  function cleanNumber(val) {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    // 쉼표, 공백, 통화단위, % 등 제거
    const str = String(val).replace(/,/g, '').replace(/%/g, '').replace(/[^\d.-]/g, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  /**
   * 헤더 텍스트를 기반으로 표준 필드 키 매핑
   */
  function findColumnKey(headers, keywords) {
    for (let key of headers) {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
      for (let kw of keywords) {
        if (normalizedKey.includes(kw.toLowerCase().replace(/\s+/g, ''))) {
          return key;
        }
      }
    }
    return null;
  }

  /**
   * 신규 사업 여부 판별
   */
  function checkIsNew(prevAmt, title, details, diffRateText) {
    if (prevAmt === 0) return true;
    const titleStr = String(title || '');
    const detailStr = String(details || '');
    const rateStr = String(diffRateText || '');
    
    const newKeywords = ['신규', '신설', '착수', '최초', '도입'];
    const hasKeyword = newKeywords.some(kw => 
      titleStr.includes(kw) || detailStr.includes(kw) || rateStr.includes(kw)
    );
    return hasKeyword;
  }

  /**
   * ArrayBuffer 또는 바이너리 데이터를 파싱하여 표준 객체 배열 반환
   */
  function parseData(fileData, fileType) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS(XLSX) 라이브러리가 로드되지 않았습니다.');
    }

    let workbook;
    if (fileType === 'csv') {
      workbook = XLSX.read(fileData, { type: 'string', raw: false });
    } else {
      workbook = XLSX.read(fileData, { type: 'array' });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // JSON 배열로 변환 (헤더 포함)
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', header: 1 });
    if (!rawRows || rawRows.length < 2) {
      throw new Error('데이터 행이 충분하지 않거나 빈 파일입니다.');
    }

    // 헤더 행 찾기 (비어있지 않은 첫 행)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, rawRows.length); i++) {
      if (rawRows[i] && rawRows[i].some(cell => String(cell).includes('분야') || String(cell).includes('사업') || String(cell).includes('예산'))) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = rawRows[headerRowIndex].map(h => String(h || '').trim());
    
    // 스마트 컬럼 매핑
    const keyCategory = findColumnKey(headers, ['분야', '중점영역', '카테고리', 'category']);
    const keyTitle = findColumnKey(headers, ['세부사업', '사업명', '주요지표', '사업', 'title']);
    const keyUnit = findColumnKey(headers, ['단위', '구분/단위', '구분', 'unit']);
    const keyPrev = findColumnKey(headers, ['2026', '전년', '기준', '(a)', 'prev']);
    const keyCurr = findColumnKey(headers, ['2027', '정부안', '당해', '(b)', 'curr', '목표']);
    const keyDiff = findColumnKey(headers, ['증감', '차이', 'b-a', 'diff']);
    const keyRate = findColumnKey(headers, ['증가율', '증감률', '증감(%)', '비율', 'rate']);
    const keyDetails = findColumnKey(headers, ['핵심내용', '보도자료', '원문', '근거', '비고', 'details', '설명']);
    const keyId = findColumnKey(headers, ['연번', '순번', '번호', 'no', 'id']);

    const categoryIdx = headers.indexOf(keyCategory);
    const titleIdx = headers.indexOf(keyTitle);
    const unitIdx = headers.indexOf(keyUnit);
    const prevIdx = headers.indexOf(keyPrev);
    const currIdx = headers.indexOf(keyCurr);
    const diffIdx = headers.indexOf(keyDiff);
    const rateIdx = headers.indexOf(keyRate);
    const detailsIdx = headers.indexOf(keyDetails);
    const idIdx = headers.indexOf(keyId);

    if (categoryIdx === -1 && titleIdx === -1) {
      throw new Error('엑셀에서 [분야] 또는 [세부 사업] 컬럼을 찾을 수 없습니다. 양식을 확인해주세요.');
    }

    const items = [];

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;

      const category = categoryIdx !== -1 ? String(row[categoryIdx] || '').trim() : '기타 분야';
      const title = titleIdx !== -1 ? String(row[titleIdx] || '').trim() : '';
      
      // 제목과 분야가 둘 다 없으면 빈 행으로 간주
      if (!category && !title) continue;
      // 요약 합계행('합계', '총계') 건너뛰기
      if (category.includes('합계') || category.includes('총계') || title.includes('합계') || title.includes('총계')) {
        continue;
      }

      const unit = unitIdx !== -1 && row[unitIdx] ? String(row[unitIdx]).trim() : '억원';
      const prevAmount = prevIdx !== -1 ? cleanNumber(row[prevIdx]) : 0;
      const currAmount = currIdx !== -1 ? cleanNumber(row[currIdx]) : 0;

      let diffAmount = diffIdx !== -1 ? cleanNumber(row[diffIdx]) : (currAmount - prevAmount);
      // 만약 엑셀에 증감 컬럼이 없었거나 0인데 prev/curr 차이가 나면 자동 계산
      if (diffAmount === 0 && (currAmount !== 0 || prevAmount !== 0)) {
        diffAmount = currAmount - prevAmount;
      }

      let diffRate = 0;
      const rawRateVal = rateIdx !== -1 ? row[rateIdx] : '';
      if (rawRateVal !== '' && !isNaN(cleanNumber(rawRateVal))) {
        diffRate = cleanNumber(rawRateVal);
      } else {
        if (prevAmount > 0) {
          diffRate = Math.round(((currAmount - prevAmount) / prevAmount) * 1000) / 10;
        } else if (currAmount > 0) {
          diffRate = 100.0;
        }
      }

      const details = detailsIdx !== -1 ? String(row[detailsIdx] || '').trim() : '';
      const idVal = idIdx !== -1 && row[idIdx] ? row[idIdx] : (items.length + 1);

      const isNew = checkIsNew(prevAmount, title, details, rawRateVal);

      items.push({
        id: idVal,
        category: category || '미분류 분야',
        title: title || '사업명 미기재',
        unit: unit,
        prevAmount: prevAmount,
        currAmount: currAmount,
        diffAmount: diffAmount,
        diffRate: diffRate,
        details: details || '상세 보도자료 및 근거 내용이 없습니다.',
        isNew: isNew
      });
    }

    if (items.length === 0) {
      throw new Error('유효한 사업 데이터 행을 찾지 못했습니다.');
    }

    return items;
  }

  return {
    parseData: parseData
  };
})();
