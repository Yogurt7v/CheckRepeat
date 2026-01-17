import { Paper, Box, Typography } from '@mui/material';

export default function Instruction() {
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Подготовка данных:
        </Typography>
        <Typography variant="body1" align="center">
          Выберите в 1с счета-фактуры полученные <strong>от всех контрагентов</strong> за
          необходимый период.
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          "Ещё" - "Вывести список"- "Табличный документ" со всеми колонками
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          ⋮ - сохранить как - Тип: лист Excel (*.xlsx , *.xls)
        </Typography>
      </Box>
    </Paper>
  );
}
