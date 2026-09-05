import React from 'react';
import { Box } from '@mui/material';
import { HistoryExporter } from './components/HistoryExporter';

const App: React.FC = () => (
  <Box sx={{ width: '100%', maxWidth: 760, mx: 'auto', minWidth: 0 }}>
    <HistoryExporter />
  </Box>
);

export default App;
