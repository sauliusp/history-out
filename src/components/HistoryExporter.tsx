import React, { useState, useEffect } from 'react';
import { Button, Alert, Stack } from '@mui/material';
import { HistoryService } from '../services/HistoryService';
import { ExportService } from '../services/ExportService';
import { StorageService } from '../services/StorageService';
import { StorageKey } from '../types/StorageKeys';
import { getRangeFromType } from '../utils/dateUtils';
import { OutputSettings } from './OutputSettings';
import { OutputConfig } from '../types/OutputConfig';
import { DateRange } from '../types/DateRange';

const INITIAL_OUTPUT_CONFIG: OutputConfig = {
  format: 'csv',
  historyRange: 'week',
  dateRange: null,
  fields: {
    order: true,
    id: true,
    date: true,
    time: true,
    title: true,
    url: true,
    visitCount: true,
    typedCount: true,
    transition: true,
  },
};

const historyService = HistoryService.getInstance();
const exportService = ExportService.getInstance();
const storageService = StorageService.getInstance();

export const HistoryExporter: React.FC = () => {
  const [config, setConfig] = useState<OutputConfig>(INITIAL_OUTPUT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sanitizeHistoryRangeConfig = (config: OutputConfig): OutputConfig => {
    return {
      ...config,
      dateRange: config.historyRange === 'custom' ? config.dateRange : null,
    };
  };

  useEffect(() => {
    const loadSavedConfig = async () => {
      const savedConfig = await storageService.get<OutputConfig>(
        StorageKey.OutputConfig
      );

      if (savedConfig && exportService.isConfigValid(savedConfig)) {
        setConfig(sanitizeHistoryRangeConfig(savedConfig));
      }
    };
    loadSavedConfig();
  }, []);

  const hasSelectedFields = Object.values(config.fields).some((field) => field);

  const hasValidDateRange =
    config.historyRange !== 'custom' ||
    (config.dateRange?.startTime != null && config.dateRange?.endTime != null);

  const submitEnabled = !loading && hasSelectedFields && hasValidDateRange;

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveDateRange: DateRange =
        config.historyRange === 'custom'
          ? config.dateRange!
          : getRangeFromType(config.historyRange);

      const items = await historyService.getHistory(effectiveDateRange);

      if (items.length === 0) {
        setError('No history entries found for the selected time range.');
        setLoading(false);
        return;
      }

      const preparedItems = await historyService.prepareHistoryItems(
        items,
        effectiveDateRange
      );

      exportService.exportData(preparedItems, config.format, config.fields);
      await storageService.set(StorageKey.OutputConfig, config);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (updates: Partial<OutputConfig>) => {
    setConfig((prev) =>
      sanitizeHistoryRangeConfig({
        ...prev,
        ...updates,
      })
    );
  };

  return (
    <Stack spacing={3} role="main" aria-label="History export section">
      <Alert
        severity={config.historyRange === 'all' ? 'warning' : 'info'}
        role="alert"
        sx={{ '& a': { color: 'inherit', textDecoration: 'underline' } }}
      >
        When using <b>All Time</b> as time range, please note that Chrome's
        default history retention is 3 months. For older history, you'll need to
        adjust your&nbsp;
        <a
          href="https://myaccount.google.com/activitycontrols"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Activity settings
        </a>
        &nbsp;(up to 36 months or disable auto-deletion).
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
