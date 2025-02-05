import React, { useState } from 'react';
import { Button, Alert, Stack, Typography } from '@mui/material';
import { HistoryService } from '../services/HistoryService';
import { ExportService } from '../services/ExportService';
import { getRangeFromType } from '../utils/dateUtils';
import { OutputSettings } from './OutputSettings';
import { OutputConfig } from '../types/OutputConfig';

const INITIAL_OUTPUT_CONFIG: OutputConfig = {
  format: 'csv',
  historyRange: 'week',
  dateRange: null,
  fields: {
    order: true,
    id: true,
    isWebUrl: true,
    referringVisitId: true,
    transition: true,
    transitionLabel: true,
    visitId: true,
    visitTime: true,
    visitTimeFormatted: true,
    title: true,
    lastVisitTime: true,
    lastVisitTimeFormatted: true,
    typedCount: true,
    url: true,
    visitCount: true,
  },
};

const historyService = HistoryService.getInstance();
const exportService = ExportService.getInstance();

export const HistoryExporter: React.FC = () => {
  const [config, setConfig] = useState<OutputConfig>(INITIAL_OUTPUT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateRangeSelected =
    Boolean(config.dateRange?.startTime) && Boolean(config.dateRange?.endTime);

  const historyRangeSelected =
    (config.historyRange === 'custom' && dateRangeSelected) ||
    Boolean(config.historyRange);

  const submitEnabled =
    !loading &&
    historyRangeSelected &&
    Object.values(config.fields).includes(true);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateRange =
        config.historyRange === 'custom'
          ? config.dateRange!
          : getRangeFromType(config.historyRange);

      const items = await historyService.getHistory(dateRange);
      const preparedItems = await historyService.prepareHistoryItems(items);

      exportService.exportData(preparedItems, config.format, config.fields);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (updates: Partial<OutputConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        Note: Chrome by default only keeps 90 days of history. You can change
        this in Chrome settings.
      </Alert>

      <Typography variant="h6" component="h1" gutterBottom>
        Export Browser History
      </Typography>

      <OutputSettings config={config} onConfigChange={handleConfigChange} />

      {error && <Alert severity="error">{error}</Alert>}

      <Button
        variant="contained"
        onClick={handleExport}
        disabled={!submitEnabled}
      >
        {loading ? 'Exporting...' : 'Export History'}
      </Button>
    </Stack>
  );
};
