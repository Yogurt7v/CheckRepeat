import { copyCellText } from './copyCellText';
import { formatAmountDisplay } from './formatAmountDisplay';

export const renderRow = (item, index) => (
  <tr key={`${item['Номер']}-${item['Сумма']}-${index}`}>
    <td onClick={copyCellText}>{item['Дата']}</td>
    <td onClick={copyCellText}>{item['Номер']}</td>
    <td onClick={copyCellText}>{formatAmountDisplay(item['Сумма'])}</td>
    <td onClick={copyCellText}>{item['Контрагент']}</td>
  </tr>
);

// === Рендер строки ===
