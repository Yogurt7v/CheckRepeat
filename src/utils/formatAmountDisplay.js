export const formatAmountDisplay = (value) => {
  if (value == null) return '';

  // Приводим к числу
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return String(value);

  // Фиксируем 2 знака после запятой
  const fixed = num.toFixed(2); // "1234567.89"

  // Разделяем целую и дробную части
  const [integer, decimal] = fixed.split('.');

  // Добавляем пробелы как разделители тысяч (справа налево)
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${formattedInteger}.${decimal}`;
};
