import React, { useState, useEffect } from 'react';
import {
  Button,
  Alert,
  Stack,
  Divider,
  Link,
  ButtonGroup,
  Box,
} from '@mui/material';
import { HistoryService } from '../services/HistoryService';
import { ExportService } from '../services/ExportService';
import { StorageService } from '../services/StorageService';
import { StorageKey } from '../types/StorageKeys';
import { getRangeFromType } from '../utils/dateUtils';
import { OutputSettings } from './OutputSettings';
import { OutputConfig } from '../types/OutputConfig';
import { DateRange } from '../types/DateRange';
import CoffeeIcon from '@mui/icons-material/Coffee';

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

const SUPPORT_BUTTONS = [
  {
    text: 'Get Support',
    href: 'https://chromewebstore.google.com/detail/historyout/idohnkdgejocejlkihihonhemndpiiei/support',
  },
  {
    text: 'Write a Review',
    href: 'https://chromewebstore.google.com/detail/historyout/idohnkdgejocejlkihihonhemndpiiei/reviews',
  },
  {
    text: 'Suggest a Feature',
    href: 'https://historyout.featurebase.app',
  },
] as const;

const TAG_CHOOSE_URL =
  'https://chromewebstore.google.com/detail/tagchoose-ai-bookmark-man/hlfgdfpeekcelanebbfchnnneijhophh';

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
      {config.historyRange === 'all' && (
        <Alert
          severity="info"
          role="alert"
          sx={{ '& a': { color: 'inherit', textDecoration: 'underline' } }}
        >
          <div>
            When exporting <strong>All Time</strong> history, note that Chrome
            typically retains only 3 months of data. To preserve longer history,
            adjust your{' '}
            <strong>
              <a
                href="https://myaccount.google.com/activitycontrols"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:text-blue-600"
              >
                Google Activity settings
              </a>
            </strong>{' '}
            to extend retention up to 36 months.
          </div>
        </Alert>
      )}

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
        loading={loading}
        size="large"
      >
        Export History
      </Button>

      <Stack spacing={3} role="complementary" aria-label="Support options">
        <ButtonGroup
          size="small"
          variant="text"
          aria-label="Support and feedback options"
          sx={{ justifyContent: 'center' }}
        >
          {SUPPORT_BUTTONS.map((button) => (
            <Button
              key={button.text}
              href={button.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textTransform: 'none', textAlign: 'center' }}
              aria-label={`${button.text} - opens in new tab`}
            >
              {button.text}
            </Button>
          ))}
        </ButtonGroup>

        <Box
          sx={{ textAlign: 'center' }}
          role="complementary"
          aria-label="Donation option"
        >
          <Link
            href="https://www.buymeacoffee.com/saulius.developer"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee - opens in new tab"
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png"
              alt="Buy Me A Coffee"
              style={{
                height: '60px',
                width: '217px',
              }}
            />
          </Link>
        </Box>

        <Box
          sx={{
            textAlign: 'center',
            fontSize: '0.85rem',
          }}
        >
          You might be also interested in{' '}
          <Link
            href={TAG_CHOOSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            #TagChoose - AI Bookmark Manager with client-side Gemini Nano LLM
          </Link>
        </Box>
      </Stack>
    </Stack>
  );
};
