import React from 'react';
import { Stack, TextField } from '@mui/material';
import { DateRange } from '../types/DateRange';

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
}

const formatDate = (timestamp: number): string => {
  if (!Number.isFinite(timestamp)) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, disabled }) => {
  const updateDate = (text: string, end: boolean) => {
    const [year, month, day] = text.split('-').map(Number);
    const timestamp = text
      ? new Date(year, month - 1, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0).getTime()
      : Number.NaN;
    onChange({
      startTime: end ? value?.startTime ?? Number.NaN : timestamp,
      endTime: end ? timestamp : value?.endTime ?? new Date(new Date().setHours(23, 59, 59, 999)).getTime(),
    });
  };
  const today = formatDate(Date.now());

  return (
    <Stack direction="row" spacing={1} role="group" aria-label="Custom date range, in your local time">
      <TextField
        label="From" type="date" fullWidth disabled={disabled}
        value={value ? formatDate(value.startTime) : ''}
        onChange={(event) => updateDate(event.target.value, false)}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today, 'aria-label': 'Start date' } }}
        sx={{ minWidth: 0, '& input': { minWidth: 0, px: 1 } }}
      />
      <TextField
        label="Through" type="date" fullWidth disabled={disabled}
        value={value ? formatDate(value.endTime) : ''}
        onChange={(event) => updateDate(event.target.value, true)}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today, min: value ? formatDate(value.startTime) : undefined, 'aria-label': 'End date' } }}
        sx={{ minWidth: 0, '& input': { minWidth: 0, px: 1 } }}
      />
    </Stack>
  );
};
