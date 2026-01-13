export const copyCellText = (e) => {
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
