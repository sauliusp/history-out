import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { DateRangePicker } from './DateRangePicker';
import {
  HistoryService,
  HistoryRange,
  ExportFormat,
  DateRange,
} from '../services/HistoryService';
import { getRangeFromType } from '../utils/dateUtils';

export const HistoryExporter: React.FC = () => {
  const [range, setRange] = useState<HistoryRange>('week');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateRange =
        range === 'custom' ? customRange! : getRangeFromType(range);

      const historyService = HistoryService.getInstance();
      const items = await historyService.getHistory(dateRange);
      const exportData = await historyService.exportHistory(items, format);

      // Create and trigger download
      const blob = new Blob([exportData], {
        type:
          format === 'json'
            ? 'application/json'
            : format === 'csv'
            ? 'text/csv'
            : 'text/html',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `history-export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" component="h1">
        Export Browser History
      </Typography>

      <Alert severity="info">
        Note: Chrome by default only keeps 90 days of history. You can change
        this in Chrome settings.
      </Alert>

      <FormControl fullWidth>
        <InputLabel>Time Range</InputLabel>
        <Select
          value={range}
          label="Time Range"
          onChange={(e) => setRange(e.target.value as HistoryRange)}
        >
          <MenuItem value="day">Last 24 Hours</MenuItem>
          <MenuItem value="week">Last Week</MenuItem>
          <MenuItem value="month">Last Month</MenuItem>
          <MenuItem value="all">All Time</MenuItem>
          <MenuItem value="custom">Custom Range</MenuItem>
        </Select>
      </FormControl>

      {range === 'custom' && (
        <DateRangePicker value={customRange} onChange={setCustomRange} />
      )}

      <FormControl fullWidth>
        <InputLabel>Export Format</InputLabel>
        <Select
          value={format}
          label="Export Format"
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
        >
          <MenuItem value="csv">CSV</MenuItem>
          <MenuItem value="json">JSON</MenuItem>
          <MenuItem value="html">HTML</MenuItem>
        </Select>
      </FormControl>

      {error && <Alert severity="error">{error}</Alert>}

      <Button
        variant="contained"
        onClick={handleExport}
        disabled={loading || (range === 'custom' && !customRange)}
      >
        {loading ? 'Exporting...' : 'Export History'}
      </Button>
    </Stack>
  );
};
