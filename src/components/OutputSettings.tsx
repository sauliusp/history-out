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

  return (
    <Stack spacing={3} role="form" aria-label="Export settings form">
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="export-format-label">Export Format</InputLabel>
          <Select
            labelId="export-format-label"
            id="export-format-select"
            value={config.format}
            label="Export Format"
            onChange={(e) => handleFormatChange(e.target.value as ExportFormat)}
            aria-describedby="export-format-description"
          >
            <MenuItem value="csv" role="option">
              CSV
            </MenuItem>
            <MenuItem value="json" role="option">
              JSON
            </MenuItem>
            <MenuItem value="html" role="option">
              HTML
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            id="time-range-select"
            value={config.historyRange}
            label="Time Range"
            onChange={(e) =>
              onConfigChange({
                historyRange: e.target.value as HistoryRange,
              })
            }
            aria-describedby="time-range-description"
          >
            <MenuItem value="day" role="option">
              Last 24 Hours
            </MenuItem>
            <MenuItem value="week" role="option">
              Last 7 days
            </MenuItem>
            <MenuItem value="month" role="option">
              Last 30 days
            </MenuItem>
            <MenuItem value="all" role="option">
              All Time
            </MenuItem>
            <MenuItem value="custom" role="option">
              Custom Range
            </MenuItem>
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
        <InputLabel id="include-fields-label">Include Fields</InputLabel>
        <Select
          labelId="include-fields-label"
          id="include-fields-select"
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
            <Box
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
              role="list"
            >
              {columnOrder
                .filter((field) => (selected as string[]).includes(field))
                .map((field) => (
                  <Chip
                    key={field}
                    label={columnLabels[field].label}
                    size="small"
                    sx={{ m: 0.25 }}
                    role="listitem"
                  />
                ))}
            </Box>
          )}
          aria-describedby="include-fields-description"
        >
          {columnOrder.map((field) => (
            <MenuItem key={field} value={field} role="option">
              <Checkbox
                checked={config.fields[field]}
                aria-label={`Include ${columnLabels[field]}`}
              />
              <ListItemText
                primary={columnLabels[field].label}
                secondary={columnLabels[field].secondaryLabel}
                sx={{
                  '& .MuiListItemText-secondary': {
                    whiteSpace: 'normal',
                    wordBreak: 'break-word', // Using wordBreak instead of wordWrap for better backwards compatibility
                  },
                }}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};
