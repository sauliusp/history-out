import { t, countText } from '../i18n';
import React from 'react';
import {
  Checkbox, FormControl, FormHelperText, InputLabel, ListItemText,
  MenuItem, Select, Stack, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { ExportFormat } from '../types/ExportFormat';
import { OutputConfig } from '../types/OutputConfig';
import { ExportService } from '../services/ExportService';

const exportService = ExportService.getInstance();
const columnLabels = exportService.columnLabelMap;
const columnOrder = exportService.columnOrder;

interface OutputSettingsProps {
  config: OutputConfig;
  onConfigChange: (updates: Partial<OutputConfig>) => void;
  disabled?: boolean;
}

export const OutputSettings: React.FC<OutputSettingsProps> = ({ config, onConfigChange, disabled }) => {
  const selectedFields = columnOrder.filter((field) => config.fields[field]);
  return (
    <Stack spacing={1.2} role="group" aria-label={t("Export file settings")}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component="h2" variant="h2">{t("Your export")}</Typography>
        <Typography variant="caption" color="text.secondary">{t("Choose what goes in your file")}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <ToggleButtonGroup
          value={config.format} exclusive disabled={disabled} size="small"
          aria-label={t("Export format")}
          onChange={(_, format: ExportFormat | null) => format && onConfigChange({ format })}
          sx={{ flex: '1 1 54%', '& button': { flex: 1, height: 40, px: 1 } }}
        >
          <ToggleButton value="csv" aria-label={t("CSV, for spreadsheets")}>CSV</ToggleButton>
          <ToggleButton value="json" aria-label={t("JSON, structured data")}>JSON</ToggleButton>
          <ToggleButton value="html" aria-label={t("HTML, readable in a browser")}>HTML</ToggleButton>
        </ToggleButtonGroup>
        <FormControl sx={{ flex: '1 1 46%', minWidth: 0 }} error={!selectedFields.length} disabled={disabled}>
          <InputLabel id="include-fields-label">{t("Include")}</InputLabel>
          <Select
            labelId="include-fields-label" id="include-fields-select" multiple
            value={selectedFields} label={t("Include")}
            onChange={(event) => {
              const selected = event.target.value as string[];
              const fields = { ...config.fields };
              columnOrder.forEach((field) => { fields[field] = selected.includes(field); });
              onConfigChange({ fields });
            }}
            renderValue={(selected) => countText('columns', selected.length)}
            MenuProps={{ PaperProps: { sx: { maxHeight: 380, maxWidth: 350 } } }}
            aria-describedby={!selectedFields.length ? 'fields-error' : undefined}
          >
            {columnOrder.map((field) => (
              <MenuItem key={field} value={field} sx={{ py: 0.5 }}>
                <Checkbox checked={!!config.fields[field]} aria-label={t('Include {column}', { column: columnLabels[field].label })} tabIndex={-1} />
                <ListItemText
                  primary={columnLabels[field].label}
                  secondary={columnLabels[field].secondaryLabel}
                  sx={{ ml: 0.5, '& .MuiListItemText-secondary': { whiteSpace: 'normal', fontSize: '0.75rem' } }}
                />
              </MenuItem>
            ))}
          </Select>
          {!selectedFields.length && <FormHelperText id="fields-error">{t("Choose at least one column.")}</FormHelperText>}
        </FormControl>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {config.format === 'csv' ? t("CSV opens in Excel, Google Sheets and other spreadsheets.") : config.format === 'json' ? t("JSON keeps your selected fields as structured data.") : t("HTML gives you a readable file with clickable page links.")}
      </Typography>
    </Stack>
  );
};
