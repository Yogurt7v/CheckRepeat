export const formatAmount = (amount) => {
  if (typeof amount !== 'number') return String(amount);
  return Math.round(amount * 100) / 100;
};

//Цель — нормализовать числовое значение суммы, чтобы избежать ошибок при сравнении из-за особенностей чисел с плавающей точкой.
