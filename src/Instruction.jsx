export default function Instruction() {
  return (
    <div className="instruction-container">
      <strong className="instruction-title">Подготовка данных:</strong>
      <p>
        Выберите в 1с счета-фактуры полученные <strong>от всех контрагентов</strong> за
        необходимый период.
      </p>
      <p>"Ещё" - "Вывести список"- "Табличный документ" со всеми колонками</p>
      <p>⋮ - сохранить как - Тип: лист Excel (*.xlsx , *.xls)</p>
      <strong className="instruction-title">Загрузка данных:</strong>
    </div>
  );
}
