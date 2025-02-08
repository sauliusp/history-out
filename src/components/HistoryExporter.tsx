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
    referringVisitId: false,
    transition: true,
    transitionLabel: true,
    visitId: true,
    visitTime: false,
    visitTimeFormatted: true,
    title: true,
    lastVisitTime: false,
    lastVisitTimeFormatted: false,
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

  const hasSelectedFields = Object.values(config.fields).some((field) => field);

  const hasValidDateRange =
    config.historyRange !== 'custom' ||
    (config.dateRange?.startTime != null && config.dateRange?.endTime != null);

  const submitEnabled = !loading && hasSelectedFields && hasValidDateRange;

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
    <Stack spacing={3} role="main" aria-label="History export section">
      <Alert
        severity="info"
        role="alert"
        sx={{ '& a': { color: 'inherit', textDecoration: 'underline' } }}
      >
        Chrome typically keeps history for up to 3 months unless you've
        adjusted&nbsp;
        <a
          href="https://myaccount.google.com/activitycontrols"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Activity settings
        </a>
        . You can extend it up to 36 months or even disable auto-deletion.
      </Alert>

      <OutputSettings config={config} onConfigChange={handleConfigChange} />

      {error && (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={handleExport}
        disabled={!submitEnabled}
        aria-busy={loading}
        aria-disabled={!submitEnabled}
      >
        {loading ? 'Exporting...' : 'Export History'}
      </Button>
    </Stack>
  );
};
