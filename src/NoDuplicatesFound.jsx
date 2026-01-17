import React from 'react';

const NoDuplicatesFound = () => {
  return (
    <div className="no-duplicates-container">
      <p className="error-message">
        В загруженных данных не обнаружено дубликатов по заданным критериям. Проверьте
        данные или попробуйте другой файл.
      </p>
    </div>
  );
};

export default NoDuplicatesFound;
