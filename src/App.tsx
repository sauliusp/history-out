import React from 'react';
import { Box, Container } from '@mui/material';
import { HistoryExporter } from './components/HistoryExporter';

const App: React.FC = () => {
  return (
    <Container>
      <Box sx={{ py: 2 }}>
        <HistoryExporter />
      </Box>
    </Container>
  );
};

export default App;
