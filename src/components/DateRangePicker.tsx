import React from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { DateRange } from '../types/DateRange';
import { isValidDateRange } from '../utils/outputConfig';

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
  // V1 saved UTC boundaries. Keep those exact times, but explain them when
  // they are not whole days in the user's current time zone.
  const partialDays = isValidDateRange(value) && (
    new Date(value.startTime).setHours(0, 0, 0, 0) !== value.startTime ||
    new Date(value.endTime).setHours(23, 59, 59, 999) !== value.endTime
  );
  const exactTime = (timestamp: number) => new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
  });

  return (
    <Stack spacing={1} role="group" aria-label="Custom date range, in your local time">
      {partialDays && <Typography id="exact-saved-range" variant="caption" color="text.secondary">
        Exact saved times: {exactTime(value!.startTime)} to {exactTime(value!.endTime)} (your local time).
        {' '}These are the times used for preview and export. You can use full local days for the dates shown below.
      </Typography>}
      {partialDays && <Button size="small" disabled={disabled} sx={{alignSelf: 'flex-start'}} onClick={() => {
        if (isValidDateRange(value)) onChange({
          startTime: new Date(value.startTime).setHours(0, 0, 0, 0),
          endTime: new Date(value.endTime).setHours(23, 59, 59, 999),
        });
      }}>Use full local days</Button>}
      <Stack direction="row" spacing={1}>
      <TextField
        label="From" type="date" fullWidth disabled={disabled}
        value={value ? formatDate(value.startTime) : ''}
        onChange={(event) => updateDate(event.target.value, false)}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today, 'aria-label': 'Start date', 'aria-describedby': partialDays ? 'exact-saved-range' : undefined } }}
        sx={{ minWidth: 0, '& input': { minWidth: 0, px: 1 } }}
      />
      <TextField
        label="Through" type="date" fullWidth disabled={disabled}
        value={value ? formatDate(value.endTime) : ''}
        onChange={(event) => updateDate(event.target.value, true)}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today, min: value ? formatDate(value.startTime) : undefined, 'aria-label': 'End date', 'aria-describedby': partialDays ? 'exact-saved-range' : undefined } }}
        sx={{ minWidth: 0, '& input': { minWidth: 0, px: 1 } }}
      />
      </Stack>
    </Stack>
  );
};
