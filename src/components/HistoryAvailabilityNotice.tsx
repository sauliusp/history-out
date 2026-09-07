import React from 'react';
import { Box, Link, Typography } from '@mui/material';

/** Guidance only: the browser, not this notice, determines which visits exist. */
export const HistoryAvailabilityNotice: React.FC = () => (
  <Box component="aside" aria-labelledby="history-availability-title" sx={{ mt: 1.3, px: 1.3, py: 1.15, bgcolor: '#f0f5fc', border: '1px solid #d8e4f3', borderRadius: '9px' }}>
    <Typography id="history-availability-title" variant="body2" sx={{ fontWeight: 700, color: '#244667', mb: 0.4 }}>Looking for older history?</Typography>
    <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: '#435b75', lineHeight: 1.5 }}>
      Exports use the history still available in this browser. Chrome normally keeps about 90 days. Choosing older dates cannot restore expired or deleted visits.
    </Typography>
    <Box component="details" sx={{ mt: 0.7, color: '#435b75', fontSize: '0.8125rem', lineHeight: 1.5, '& summary': { cursor: 'pointer', color: '#185adb', fontWeight: 650, py: 0.3, width: 'fit-content', borderRadius: '3px' }, '& summary:focus-visible': { outline: '2px solid #185adb', outlineOffset: 3 } }}>
      <summary>Keep history for longer</summary>
      <Typography component="p" sx={{ fontSize: 'inherit', lineHeight: 'inherit', mt: 0.8 }}>
        Chrome has no built-in setting to extend its local history limit. Other browsers may differ.
      </Typography>
      <Box component="ol" sx={{ pl: 2.1, my: 0.8, '& li + li': { mt: 0.35 } }}>
        <li>Export the history available now, then repeat regularly, for example once a month.</li>
        <li>Keep dated CSV, JSON or HTML files in a folder you back up.</li>
      </Box>
      <Typography component="p" sx={{ fontSize: 'inherit', lineHeight: 'inherit', mb: 0.8 }}>
        Saved views remember your settings, not your visits. Google My Activity is separate: changing its settings will not extend the history available here.
      </Typography>
      <Link href="https://exportchromehistory.app/guides/browser-history-limits/" target="_blank" rel="noopener noreferrer" sx={{ fontSize: 'inherit' }}>History limits and other options ↗</Link>
    </Box>
  </Box>
);
