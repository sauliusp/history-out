import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ExportFormat } from '../types/ExportFormat';
import { OutputConfig } from '../types/OutputConfig';

// Field groups configuration for better organization and maintainability
export const FIELD_GROUPS = {
  'Basic Information': ['order', 'title', 'url'],
  'Visit Details': [
    'visitTime',
    'visitTimeFormatted',
    'lastVisitTime',
    'lastVisitTimeFormatted',
    'visitCount',
    'typedCount',
  ],
  'Technical Details': [
    'id',
    'isWebUrl',
    'referringVisitId',
    'transition',
    'transitionLabel',
    'visitId',
  ],
} as const;

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
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Export Settings
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
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

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Include Fields
      </Typography>

      {Object.entries(FIELD_GROUPS).map(([group, fields]) => (
        <Accordion key={group} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{group}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {fields.map((field) => (
                <FormControlLabel
                  key={field}
                  control={
                    <Checkbox
                      checked={
                        config.fields[field as keyof typeof config.fields]
                      }
                      onChange={() =>
                        handleFieldToggle(field as keyof typeof config.fields)
                      }
                    />
                  }
                  label={field.replace(/([A-Z])/g, ' $1').toLowerCase()}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
};
