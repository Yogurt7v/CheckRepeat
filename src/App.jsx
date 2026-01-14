import React, { useState, useRef } from 'react';
import { read, utils } from 'xlsx';
import './App.css';
import { formatAmount } from './utils/formatAmount';
import { renderRow } from './utils/renderRow';
import Instruction from './Instruction';

const App = () => {
  const [data, setData] = useState([]);
  const [duplicatesBySumAndNumber, setDuplicatesBySumAndNumber] = useState([]);
  const [duplicatesBySumCounterpartyDate, setDuplicatesBySumCounterpartyDate] = useState(
    []
  );
  const [duplicatesBySumOnly, setDuplicatesBySumOnly] = useState([]);
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);

  // Фильтры
  const [
    selectedCounterpartyForSumCounterpartyDate,
    setSelectedCounterpartyForSumCounterpartyDate,
  ] = useState('');
  const [selectedCounterpartyForSumOnly, setSelectedCounterpartyForSumOnly] =
    useState('');

  const fileInputRef = useRef(null);
  const upPageRef = useRef(null);

  // === Загрузка Excel ===
  const handleExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = utils.sheet_to_json(worksheet);

      setData(jsonData);
      setDuplicatesBySumAndNumber([]);
      setDuplicatesBySumCounterpartyDate([]);
      setDuplicatesBySumOnly([]);
      setSelectedCounterpartyForSumCounterpartyDate('');
      setSelectedCounterpartyForSumOnly('');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleExcelFile(file);
    }
  };

  const scrollToTop = () => {
    if (upPageRef.current) {
      upPageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCellClick = (e) => {
    e.stopPropagation();
    const text = e.target.textContent || '';
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Ошибка копирования:', err);
    });

    const originalBg = e.target.style.backgroundColor;
    e.target.style.backgroundColor = '#d1ecf1';
    setTimeout(() => {
      e.target.style.backgroundColor = originalBg;
    }, 200);

    setShowCopiedPopup(true);
    setTimeout(() => setShowCopiedPopup(false), 2000);
  };

  // === Поиск дубликатов ===
  const handleCheck = () => {
    if (data.length === 0) return;

    // 1. Сумма + Номер
    const sumNumberMap = new Map();
    for (const item of data) {
      const key = `${formatAmount(item['Сумма'])}-${item['Номер']}`;
      if (!sumNumberMap.has(key)) sumNumberMap.set(key, []);
      sumNumberMap.get(key).push(item);
    }
    const duplicatesBySumAndNumber = Array.from(sumNumberMap.values())
      .filter((group) => group.length > 1)
      .flat();

    // 2. Сумма + Контрагент
    const sumCounterMap = new Map();
    for (const item of data) {
      // Нормализуем дату: убираем время, если есть (например, "01.07.2025 7:00:00" → "01.07.2025")
      const datePart = String(item['Дата']).split(' ')[0]; // берём только первую часть до пробела
      const key = `${formatAmount(item['Сумма'])}-${item['Контрагент']}-${datePart}`;
      if (!sumCounterMap.has(key)) sumCounterMap.set(key, []);
      sumCounterMap.get(key).push(item);
    }
    const duplicatesBySumCounterpartyDate = Array.from(sumCounterMap.values())
      .filter((group) => group.length > 1)
      .flat();

    // 3. Только Сумма
    const sumMap = new Map();
    for (const item of data) {
      const key = formatAmount(item['Сумма']);
      if (!sumMap.has(key)) sumMap.set(key, []);
      sumMap.get(key).push(item);
    }
    const duplicatesBySum = Array.from(sumMap.values())
      .filter((group) => group.length > 1)
      .flat();

    setDuplicatesBySumAndNumber(duplicatesBySumAndNumber);
    setDuplicatesBySumCounterpartyDate(duplicatesBySumCounterpartyDate);
    setDuplicatesBySumOnly(duplicatesBySum);
    setSelectedCounterpartyForSumCounterpartyDate('');
    setSelectedCounterpartyForSumOnly('');
  };

  // === Очистка ===
  const handleClear = () => {
    setData([]);
    setDuplicatesBySumAndNumber([]);
    setDuplicatesBySumCounterpartyDate([]);
    setDuplicatesBySumOnly([]);
    setSelectedCounterpartyForSumCounterpartyDate('');
    setSelectedCounterpartyForSumOnly('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // === Уникальные контрагенты для фильтров ===
  const uniqueCounterpartiesSumCp = [
    ...new Set(
      duplicatesBySumCounterpartyDate.map((item) => item['Контрагент']).filter(Boolean)
    ),
  ].sort();

  const uniqueCounterpartiesSumOnly = [
    ...new Set(duplicatesBySumOnly.map((item) => item['Контрагент']).filter(Boolean)),
  ].sort();

  // === Фильтрация данных ===
  const filteredSumCounterparty = selectedCounterpartyForSumCounterpartyDate
    ? duplicatesBySumCounterpartyDate.filter(
        (item) => item['Контрагент'] === selectedCounterpartyForSumCounterpartyDate
      )
    : duplicatesBySumCounterpartyDate;

  const filteredSumOnly = selectedCounterpartyForSumOnly
    ? duplicatesBySumOnly.filter(
        (item) => item['Контрагент'] === selectedCounterpartyForSumOnly
      )
    : duplicatesBySumOnly;

  return (
    <div className="app-container" ref={upPageRef}>
      <h2 className="main-title">Анализ дубликатов счетов-фактур</h2>

      {data.length <= 0 && <Instruction />}

      <div className="form-section">
        <div className="file-input-container">
          <label htmlFor="file-upload" className="file-upload-label">
            Выбрать Excel файл
          </label>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="file-input-hidden"
          />
        </div>
        <div className="button-group">
          <button
            onClick={handleCheck}
            disabled={data.length <= 0}
            className="btn-primary"
          >
            Найти дубликаты
          </button>
          <button onClick={handleClear} className="btn-danger">
            Очистить
          </button>
        </div>
      </div>

      {/* Дубли по Сумма + Номер */}
      {duplicatesBySumAndNumber.length > 0 && (
        <div className="duplicates-section">
          <h3 className="section-header">
            Дубликаты по «Сумма + Номер» ({duplicatesBySumAndNumber.length})
          </h3>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Номер</th>
                <th>Сумма</th>
                <th>Контрагент</th>
              </tr>
            </thead>
            <tbody>
              {duplicatesBySumAndNumber.map((item, index) =>
                renderRow(item, index, handleCellClick)
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Дубли по Сумма + Контрагент — с фильтром */}
      {duplicatesBySumCounterpartyDate.length > 0 && (
        <div className="duplicates-section">
          <div className="filter-container">
            <h3 className="section-title">
              Дубликаты по «Дата + Сумма + Контрагент» (
              {duplicatesBySumCounterpartyDate.length})
            </h3>
            <select
              value={selectedCounterpartyForSumCounterpartyDate}
              onChange={(e) =>
                setSelectedCounterpartyForSumCounterpartyDate(e.target.value)
              }
              className="filter-select"
            >
              <option value="">— Все контрагенты —</option>
              {uniqueCounterpartiesSumCp.map((counterparty) => (
                <option key={counterparty} value={counterparty}>
                  {counterparty}
                </option>
              ))}
            </select>
          </div>

          {filteredSumCounterparty.length > 0 ? (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Номер</th>
                  <th>Сумма</th>
                  <th>Контрагент</th>
                </tr>
              </thead>
              <tbody>
                {filteredSumCounterparty.map((item, index) =>
                  renderRow(item, index, handleCellClick)
                )}
              </tbody>
            </table>
          ) : (
            <p className="no-data-message">Нет записей для выбранного контрагента.</p>
          )}
        </div>
      )}

      {/* Дубли только по Сумма — с фильтром */}
      {duplicatesBySumOnly.length > 0 && (
        <div className="duplicates-section">
          <div className="filter-container">
            <h3 className="section-title">
              Дубликаты только по «Сумма» ({duplicatesBySumOnly.length})
            </h3>
            <select
              value={selectedCounterpartyForSumOnly}
              onChange={(e) => setSelectedCounterpartyForSumOnly(e.target.value)}
              className="filter-select"
            >
              <option value="">— Все контрагенты —</option>
              {uniqueCounterpartiesSumOnly.map((counterparty) => (
                <option key={counterparty} value={counterparty}>
                  {counterparty}
                </option>
              ))}
            </select>
          </div>

          {filteredSumOnly.length > 0 ? (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Номер</th>
                  <th>Сумма</th>
                  <th>Контрагент</th>
                </tr>
              </thead>
              <tbody>
                {filteredSumOnly.map((item, index) =>
                  renderRow(item, index, handleCellClick)
                )}
              </tbody>
            </table>
          ) : (
            <p className="no-data-message">Нет записей для выбранного контрагента.</p>
          )}
          <button onClick={scrollToTop} className="btn-sticky">
            Наверх
          </button>
        </div>
      )}

      {showCopiedPopup && <div className="copied-popup">Скопировано</div>}
    </div>
  );
};

export default App;
