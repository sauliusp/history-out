import React from 'react';
import { Stack, TextField } from '@mui/material';
import { DateRange } from '../services/HistoryService';

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

  return (
    <Stack direction="row" spacing={2}>
      <TextField
        label="Start Date"
        type="date"
        value={value ? formatDate(value.startTime) : ''}
        onChange={handleStartChange}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <TextField
        label="End Date"
        type="date"
        value={value ? formatDate(value.endTime) : ''}
        onChange={handleEndChange}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
    </Stack>
  );
};
