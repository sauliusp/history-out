import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Checkbox,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import { ExportFormat } from '../types/ExportFormat';
import { OutputConfig } from '../types/OutputConfig';
import { ExportService } from '../services/ExportService';
import { OutputHistoryItem } from '../types/OutputHistoryItem';
import { DateRangePicker } from '../components/DateRangePicker';
import { HistoryRange } from '../types/HistoryRange';

const exportService = ExportService.getInstance();
const columnLabels = exportService.columnLabelMap;
const columnOrder = exportService.columnOrder;

interface OutputSettingsProps {
  config: OutputConfig;
  onConfigChange: (updates: Partial<OutputConfig>) => void;
}

export const OutputSettings: React.FC<OutputSettingsProps> = ({
  config,
  onConfigChange,
}) => {
  const handleFormatChange = (format: ExportFormat) => {
    onConfigChange({ format });
  };

  const handleFieldToggle = (field: keyof typeof config.fields) => {
    onConfigChange({
      fields: {
        ...config.fields,
        [field]: !config.fields[field],
      },
    });
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <InputLabel>Export Format</InputLabel>
          <Select
            value={config.format}
            label="Export Format"
            onChange={(e) => handleFormatChange(e.target.value as ExportFormat)}
          >
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="json">JSON</MenuItem>
            <MenuItem value="html">HTML</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={config.historyRange}
            label="Time Range"
            onChange={(e) =>
              onConfigChange({
                historyRange: e.target.value as HistoryRange,
              })
            }
          >
            <MenuItem value="day">Last 24 Hours</MenuItem>
            <MenuItem value="week">Last 7 days</MenuItem>
            <MenuItem value="month">Last 30 days</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {config.historyRange === 'custom' && (
        <DateRangePicker
          value={config.dateRange}
          onChange={(dateRange) => onConfigChange({ dateRange })}
        />
      )}

      <FormControl fullWidth>
        <InputLabel>Include Fields</InputLabel>
        <Select
          multiple
          value={Object.entries(config.fields)
            .filter(([_, included]) => included)
            .map(([field]) => field)}
          label="Include Fields"
          onChange={(e) => {
            const selectedFields = e.target.value as string[];
            const updates = Object.keys(config.fields).reduce(
              (acc, field) => ({
                ...acc,
                [field]: selectedFields.includes(field),
              }),
              {}
            );
            onConfigChange({
              fields: updates as Record<keyof OutputHistoryItem, boolean>,
            });
          }}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {columnOrder
                .filter((field) => (selected as string[]).includes(field))
                .map((field) => (
                  <Chip
                    key={field}
                    label={columnLabels[field]}
                    size="small"
                    sx={{ m: 0.25 }}
                  />
                ))}
            </Box>
          )}
        >
          {columnOrder.map((field) => (
            <MenuItem key={field} value={field}>
              <Checkbox checked={config.fields[field]} />
              <ListItemText primary={columnLabels[field]} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};
