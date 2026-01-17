import React, { useState, useRef } from 'react';
import { read, utils } from 'xlsx';
import { formatAmount } from './utils/formatAmount';
import Instruction from './Instruction';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Fab,
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  FileCopy as FileCopyIcon,
} from '@mui/icons-material';

const App = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
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

      // Проверка наличия необходимых столбцов
      const requiredColumns = ['Дата', 'Номер', 'Сумма', 'Контрагент'];
      const hasAllColumns =
        jsonData.length > 0 &&
        requiredColumns.every((col) => jsonData.some((row) => col in row));

      if (!hasAllColumns) {
        setError(
          'Загруженный файл не содержит необходимых столбцов: Дата, Номер, Сумма, Контрагент.'
        );
        setData([]);
        setDuplicatesBySumAndNumber([]);
        setDuplicatesBySumCounterpartyDate([]);
        setDuplicatesBySumOnly([]);
        setSelectedCounterpartyForSumCounterpartyDate('');
        setSelectedCounterpartyForSumOnly('');
        return;
      }

      setError('');
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
    setError('');
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

  const uniqueCounterpartiesSumOnly = (() => {
    const counterpartyMap = new Map();
    for (const item of duplicatesBySumOnly) {
      const counterparty = item['Контрагент'];
      if (!counterparty) continue;
      const sum = formatAmount(item['Сумма']);
      if (!counterpartyMap.has(counterparty))
        counterpartyMap.set(counterparty, new Map());
      const sumMap = counterpartyMap.get(counterparty);
      if (!sumMap.has(sum)) sumMap.set(sum, []);
      sumMap.get(sum).push(item);
    }
    const validCounterparties = [];
    for (const [counterparty, sumMap] of counterpartyMap) {
      const hasValidSum = Array.from(sumMap.values()).some((group) => group.length > 2);
      if (hasValidSum) validCounterparties.push(counterparty);
    }
    return validCounterparties.sort();
  })();

  // === Фильтрация данных ===
  const filteredSumCounterparty = selectedCounterpartyForSumCounterpartyDate
    ? duplicatesBySumCounterpartyDate.filter(
        (item) => item['Контрагент'] === selectedCounterpartyForSumCounterpartyDate
      )
    : duplicatesBySumCounterpartyDate;

  const filteredSumOnly = (() => {
    if (!selectedCounterpartyForSumOnly) return duplicatesBySumOnly;

    // Фильтруем по контрагенту
    const filteredByCounterparty = duplicatesBySumOnly.filter(
      (item) => item['Контрагент'] === selectedCounterpartyForSumOnly
    );

    // Группируем по сумме и фильтруем группы с минимум 2 повторения
    const sumMap = new Map();
    for (const item of filteredByCounterparty) {
      const key = formatAmount(item['Сумма']);
      if (!sumMap.has(key)) sumMap.set(key, []);
      sumMap.get(key).push(item);
    }
    return Array.from(sumMap.values())
      .filter((group) => group.length > 1)
      .flat();
  })();

  return (
    <Box
      sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}
      ref={upPageRef}
    >
      <AppBar position="static" color="primary">
        <Toolbar sx={{ justifyContent: 'center' }}>
          <Typography variant="h6" component="div">
            Анализ дубликатов счетов-фактур
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {data.length <= 0 && <Instruction />}

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Загрузка данных:
            </Typography>

            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{ minWidth: 200 }}
            >
              Выбрать Excel файл
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                hidden
              />
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCheck}
                disabled={data.length <= 0}
                startIcon={<SearchIcon />}
              >
                Найти дубликаты
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClear}
                startIcon={<ClearIcon />}
              >
                Очистить
              </Button>
            </Box>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Дубли по Сумма + Номер */}
        {duplicatesBySumAndNumber.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Дубликаты по «Сумма + Номер» ({duplicatesBySumAndNumber.length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell>Номер</TableCell>
                    <TableCell>Сумма</TableCell>
                    <TableCell>Контрагент</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {duplicatesBySumAndNumber.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell onClick={handleCellClick} className="clickable-cell">
                        {item['Дата']}
                      </TableCell>
                      <TableCell onClick={handleCellClick} className="clickable-cell">
                        {item['Номер']}
                      </TableCell>
                      <TableCell onClick={handleCellClick} className="clickable-cell">
                        {formatAmount(item['Сумма'])}
                      </TableCell>
                      <TableCell onClick={handleCellClick} className="clickable-cell">
                        {item['Контрагент']}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Дубли по Сумма + Контрагент — с фильтром */}
        {duplicatesBySumCounterpartyDate.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h5" sx={{ flexGrow: 1 }}>
                Дубликаты по «Дата + Сумма + Контрагент» (
                {duplicatesBySumCounterpartyDate.length})
              </Typography>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Контрагент</InputLabel>
                <Select
                  value={selectedCounterpartyForSumCounterpartyDate}
                  onChange={(e) =>
                    setSelectedCounterpartyForSumCounterpartyDate(e.target.value)
                  }
                  label="Контрагент"
                >
                  <MenuItem value="">— Все контрагенты —</MenuItem>
                  {uniqueCounterpartiesSumCp.map((counterparty) => (
                    <MenuItem key={counterparty} value={counterparty}>
                      {counterparty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {filteredSumCounterparty.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Дата</TableCell>
                      <TableCell>Номер</TableCell>
                      <TableCell>Сумма</TableCell>
                      <TableCell>Контрагент</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSumCounterparty.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell onClick={handleCellClick} className="clickable-cell">
                          {item['Дата']}
                        </TableCell>
                        <TableCell onClick={handleCellClick} className="clickable-cell">
                          {item['Номер']}
                        </TableCell>
                        <TableCell onClick={handleCellClick} className="clickable-cell">
                          {formatAmount(item['Сумма'])}
                        </TableCell>
                        <TableCell onClick={handleCellClick} className="clickable-cell">
                          {item['Контрагент']}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 4 }}
              >
                Нет записей для выбранного контрагента.
              </Typography>
            )}
          </Paper>
        )}

        {/* Дубли только по Сумма — с фильтром */}
        {duplicatesBySumOnly.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h5" sx={{ flexGrow: 1 }}>
                Дубликаты только по «Сумма» ({duplicatesBySumOnly.length})
              </Typography>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Контрагент</InputLabel>
                <Select
                  value={selectedCounterpartyForSumOnly}
                  onChange={(e) => setSelectedCounterpartyForSumOnly(e.target.value)}
                  label="Контрагент"
                >
                  <MenuItem value="">— Все контрагенты —</MenuItem>
                  {uniqueCounterpartiesSumOnly.map((counterparty) => (
                    <MenuItem key={counterparty} value={counterparty}>
                      {counterparty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {filteredSumOnly.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Дата</TableCell>
                      <TableCell>Номер</TableCell>
                      <TableCell>Сумма</TableCell>
                      <TableCell>Контрагент</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSumOnly.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell onClick={handleCellClick} className="clickable-cell">
                          {item['Дата']}
                        </TableCell>
                        <TableCell onClick={handleCellClick} className="clickable-cell">
                          {item['Номер']}
                        </TableCell>
                        <TableCell onClick={handleCellClick} className="clickable-cell">
                          {formatAmount(item['Сумма'])}
                        </TableCell>
                        <TableCell onClick={handleCellClick} className="clickable-cell">
                          {item['Контрагент']}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 4 }}
              >
                Нет записей для выбранного контрагента.
              </Typography>
            )}
          </Paper>
        )}
      </Container>

      {/* Snackbar для уведомления о копировании */}
      <Snackbar
        open={showCopiedPopup}
        autoHideDuration={2000}
        onClose={() => setShowCopiedPopup(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled">
          Скопировано в буфер обмена
        </Alert>
      </Snackbar>

      {/* FAB для прокрутки наверх */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={scrollToTop}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Box>
  );
};

export default App;
