import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './App.css';
import { formatAmount } from './utils/formatAmount';
import { renderRow } from './utils/renderRow';

const App = () => {
  const [data, setData] = useState([]);
  const [duplicatesBySumAndNumber, setDuplicatesBySumAndNumber] = useState([]);
  const [duplicatesBySumCounterpartyDate, setDuplicatesBySumCounterpartyDate] = useState(
    []
  );
  const [duplicatesBySumOnly, setDuplicatesBySumOnly] = useState([]);

  // Фильтры
  const [
    selectedCounterpartyForSumCounterpartyDate,
    setSelectedCounterpartyForSumCounterpartyDate,
  ] = useState('');
  const [selectedCounterpartyForSumOnly, setSelectedCounterpartyForSumOnly] =
    useState('');

  const fileInputRef = useRef(null);

  // === Загрузка Excel ===
  const handleExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

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
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Анализ дубликатов в Excel</h2>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '30px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
        </div>
        <button
          onClick={handleCheck}
          disabled={data.length === 0}
          style={{ marginLeft: '10px', marginRight: '10px' }}
        >
          Найти дубликаты
        </button>
        <button
          onClick={handleClear}
          style={{ backgroundColor: '#f44336', color: 'white' }}
        >
          Очистить
        </button>
      </div>

      {/* Дубли по Сумма + Номер */}
      {duplicatesBySumAndNumber.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Дубликаты по «Сумма + Номер» ({duplicatesBySumAndNumber.length})</h3>
          <table
            border="1"
            cellPadding="6"
            style={{ width: '100%', borderCollapse: 'collapse' }}
          >
            <thead>
              <tr>
                <th>Дата</th>
                <th>Сумма</th>
                <th>Номер</th>
                <th>Контрагент</th>
              </tr>
            </thead>
            <tbody>{duplicatesBySumAndNumber.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      {/* Дубли по Сумма + Контрагент — с фильтром */}
      {duplicatesBySumCounterpartyDate.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <h3 style={{ margin: 0 }}>
              Дубликаты по «Дата + Сумма + Контрагент» (
              {duplicatesBySumCounterpartyDate.length})
            </h3>
            <select
              value={selectedCounterpartyForSumCounterpartyDate}
              onChange={(e) =>
                setSelectedCounterpartyForSumCounterpartyDate(e.target.value)
              }
              style={{ padding: '4px 8px', fontSize: '14px' }}
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
            <table
              border="1"
              cellPadding="6"
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Номер</th>
                  <th>Контрагент</th>
                </tr>
              </thead>
              <tbody>{filteredSumCounterparty.map(renderRow)}</tbody>
            </table>
          ) : (
            <p>Нет записей для выбранного контрагента.</p>
          )}
        </div>
      )}

      {/* Дубли только по Сумма — с фильтром */}
      {duplicatesBySumOnly.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <h3 style={{ margin: 0 }}>
              Дубликаты только по «Сумма» ({duplicatesBySumOnly.length})
            </h3>
            <select
              value={selectedCounterpartyForSumOnly}
              onChange={(e) => setSelectedCounterpartyForSumOnly(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '14px' }}
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
            <table
              border="1"
              cellPadding="6"
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Номер</th>
                  <th>Контрагент</th>
                </tr>
              </thead>
              <tbody>{filteredSumOnly.map(renderRow)}</tbody>
            </table>
          ) : (
            <p>Нет записей для выбранного контрагента.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
