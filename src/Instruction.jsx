export default function Instruction() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* <h2>Инструкция по использованию приложения для анализа дубликатов в Excel</h2> */}
      <strong style={{ fontSize: '20px' }}>Подготовка данных:</strong>
      <ol>
        <li>Выберите счета-фактуры полученные за необходимый период.</li>
        <li>"Ещё" - вывести список- табличный документ со всеми колонками</li>
        <li>Сохранить в Excel формате (*.xlsx , *.xls)</li>
      </ol>
      <strong style={{ fontSize: '20px' }}>Загрузка данных:</strong>
    </div>
  );
}
