import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

const App = () => {
  const [data, setData] = useState([]);
  const [duplicatesSumNumber, setDuplicatesSumNumber] = useState([]);
  const [duplicatesSum, setDuplicatesSum] = useState([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState(''); // '' = все
  const fileInputRef = useRef(null);

  // === Копирование текста из ячейки ===
  const copyCellText = (e) => {
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
  };

  // === Загрузка и парсинг Excel ===
  const handleExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setData(jsonData);
      setDuplicatesSumNumber([]);
      setDuplicatesSum([]);
      setSelectedCounterparty(''); // сброс фильтра при новой загрузке
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
  const formatAmount = (amount) => {
    if (typeof amount !== 'number') return String(amount);
    return Math.round(amount * 100) / 100;
  };

  const handleCheck = () => {
    if (data.length === 0) return;

    // Дубли по Сумма + Номер
    const sumNumberMap = new Map();
    for (const item of data) {
      const key = `${formatAmount(item['Сумма'])}-${item['Номер']}`;
      if (!sumNumberMap.has(key)) sumNumberMap.set(key, []);
      sumNumberMap.get(key).push(item);
    }
    const duplicatesBySumAndNumber = Array.from(sumNumberMap.values())
      .filter((group) => group.length > 1)
      .flat();

    // Дубли только по Сумма
    const sumMap = new Map();
    for (const item of data) {
      const key = formatAmount(item['Сумма']);
      if (!sumMap.has(key)) sumMap.set(key, []);
      sumMap.get(key).push(item);
    }
    const duplicatesBySum = Array.from(sumMap.values())
      .filter((group) => group.length > 1)
      .flat();

    setDuplicatesSumNumber(duplicatesBySumAndNumber);
    setDuplicatesSum(duplicatesBySum);
    setSelectedCounterparty(''); // сброс фильтра при новом поиске
  };

  // === Очистка ===
  const handleClear = () => {
    setData([]);
    setDuplicatesSumNumber([]);
    setDuplicatesSum([]);
    setSelectedCounterparty('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // === Уникальные контрагенты из дублей по сумме ===
  const uniqueCounterparties = [
    ...new Set(duplicatesSum.map((item) => item['Контрагент']).filter(Boolean)),
  ].sort();

  // === Фильтрация данных для отображения ===
  const filteredDuplicatesSum = selectedCounterparty
    ? duplicatesSum.filter((item) => item['Контрагент'] === selectedCounterparty)
    : duplicatesSum;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Проверка дубликатов</h2>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '15px' }}>
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
      {duplicatesSumNumber.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Дубликаты по «Сумма + Номер» ({duplicatesSumNumber.length})</h3>
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
            <tbody>
              {duplicatesSumNumber.map((item, index) => (
                <tr key={`${item['Номер']}-${item['Сумма']}-${index}`}>
                  <td onClick={copyCellText}>{item['Дата']}</td>
                  <td onClick={copyCellText}>{item['Сумма']}</td>
                  <td onClick={copyCellText}>{item['Номер']}</td>
                  <td onClick={copyCellText}>{item['Контрагент']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Дубли только по Сумма — с фильтром */}
      {duplicatesSum.length > 0 && (
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
              Дубликаты только по «Сумма» ({duplicatesSum.length})
            </h3>
            <select
              value={selectedCounterparty}
              onChange={(e) => setSelectedCounterparty(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '14px' }}
            >
              <option value="">— Все контрагенты —</option>
              {uniqueCounterparties.map((counterparty) => (
                <option key={counterparty} value={counterparty}>
                  {counterparty}
                </option>
              ))}
            </select>
          </div>

          {filteredDuplicatesSum.length > 0 ? (
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
              <tbody>
                {filteredDuplicatesSum.map((item, index) => (
                  <tr key={`${item['Номер']}-${item['Сумма']}-${index}`}>
                    <td onClick={copyCellText}>{item['Дата']}</td>
                    <td onClick={copyCellText}>{item['Сумма']}</td>
                    <td onClick={copyCellText}>{item['Номер']}</td>
                    <td onClick={copyCellText}>{item['Контрагент']}</td>
                  </tr>
                ))}
              </tbody>
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
