import React from 'react';
import { Stack, TextField } from '@mui/material';
import { DateRange } from '../types/DateRange';

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
}) => {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = new Date(e.target.value);
    onChange({
      startTime: startDate.getTime(),
      endTime: value?.endTime || Date.now(),
    });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endDate = new Date(e.target.value);
    onChange({
      startTime: value?.startTime || Date.now(),
      endTime: endDate.getTime(),
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toISOString().split('T')[0];
  };

  const today = formatDate(Date.now());

  return (
    <Stack
      direction="row"
      spacing={2}
      role="group"
      aria-label="Date range selection"
    >
      <TextField
        label="Start Date"
        type="date"
        value={value ? formatDate(value.startTime) : ''}
        onChange={handleStartChange}
        slotProps={{
          inputLabel: {
            shrink: true,
          },
          input: {
            'aria-label': 'Start date',
            'aria-describedby': 'start-date-description',
            inputProps: {
              max: value ? formatDate(value.endTime) : today,
            },
          },
        }}
        fullWidth
      />
      <TextField
        label="End Date"
        type="date"
        value={value ? formatDate(value.endTime) : ''}
        onChange={handleEndChange}
        disabled={!value?.startTime}
        slotProps={{
          inputLabel: {
            shrink: true,
          },
          input: {
            'aria-label': 'End date',
            'aria-describedby': 'end-date-description',
            inputProps: {
              max: today,
              min: value ? formatDate(value.startTime) : undefined,
            },
          },
        }}
        fullWidth
      />
    </Stack>
  );
};
