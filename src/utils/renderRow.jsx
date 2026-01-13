import { formatAmountDisplay } from './formatAmountDisplay';

export const renderRow = (item, index, onCellClick) => (
  <tr key={`${item['Номер']}-${item['Сумма']}-${index}`}>
    <td onClick={onCellClick}>{item['Дата']}</td>
    <td onClick={onCellClick}>{item['Номер']}</td>
    <td onClick={onCellClick}>{formatAmountDisplay(item['Сумма'])}</td>
    <td onClick={onCellClick}>{item['Контрагент']}</td>
  </tr>
);

// === Рендер строки ===
