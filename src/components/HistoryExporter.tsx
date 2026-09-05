import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, Divider, FormControl, FormControlLabel,
  IconButton, InputAdornment, InputLabel, LinearProgress, Link, MenuItem,
  Select, Stack, TextField, Typography, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { HistoryService } from '../services/HistoryService';
import { ExportService } from '../services/ExportService';
import { StorageService } from '../services/StorageService';
import { StorageKey } from '../types/StorageKeys';
import { getRangeFromType } from '../utils/dateUtils';
import { filterHistory, getDomain, summarizeHistory } from '../utils/historyUtils';
import { DEFAULT_OUTPUT_CONFIG, normalizeOutputConfig } from '../utils/outputConfig';
import { OutputSettings } from './OutputSettings';
import { DateRangePicker } from './DateRangePicker';
import { OutputConfig } from '../types/OutputConfig';
import { OutputHistoryItem } from '../types/OutputHistoryItem';
import { HistoryRange } from '../types/HistoryRange';
import { DateRange } from '../types/DateRange';

const historyService = HistoryService.getInstance();
const exportService = ExportService.getInstance();
const storageService = StorageService.getInstance();
const PREVIEW_LIMIT = 100;
const SAVED_VIEWS_KEY = 'historyoutSavedViews';
const STORE_URL = 'https://chromewebstore.google.com/detail/historyout/idohnkdgejocejlkihihonhemndpiiei';
interface SavedView {
  id: string;
  name: string;
  config: OutputConfig;
  query: string;
  domain: string;
  uniqueUrls: boolean;
  stripQuery: boolean;
}
const normalizeViews = (value: unknown): SavedView[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((view) => view && typeof view === 'object' && typeof view.name === 'string' && typeof view.id === 'string').slice(0, 12).map((view) => ({
    id: view.id.slice(0, 80), name: view.name.slice(0, 40), config: normalizeOutputConfig(view.config),
    query: typeof view.query === 'string' ? view.query.slice(0, 500) : '',
    domain: typeof view.domain === 'string' ? view.domain.slice(0, 253) : '',
    uniqueUrls: view.uniqueUrls === true, stripQuery: view.stripQuery === true,
  }));
};
const number = (value: number) => value.toLocaleString();
const card = { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: 1.75 };

const pageDetails = (url: string) => {
  try {
    const parsed = new URL(url);
    return { domain: parsed.hostname || parsed.protocol, path: `${parsed.hostname}${parsed.pathname}${parsed.search}${parsed.hash}`, safe: ['http:', 'https:'].includes(parsed.protocol) };
  } catch {
    return { domain: 'Page', path: url, safe: false };
  }
};

const PreviewRow: React.FC<{ item: OutputHistoryItem }> = ({ item }) => {
  const details = pageDetails(item.url);
  const title = item.title || details.domain || 'Untitled page';
  return (
    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1, py: 1.15, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
      <Box aria-hidden="true" sx={{ width: 28, height: 30, flexShrink: 0, mt: 0.2, borderRadius: '7px', bgcolor: '#eef2fa', color: '#5a6c8e', display: 'grid', placeItems: 'center', fontWeight: 750, fontSize: 13 }}>
        {details.domain.replace(/^www\./, '').slice(0, 1).toUpperCase()}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {details.safe ? (
          <Link href={item.url} target="_blank" rel="noopener noreferrer" color="text.primary" title={title} sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </Link>
        ) : (
          <Typography variant="body2" fontWeight={650} noWrap title={title}>{title}</Typography>
        )}
        <Typography variant="caption" color="text.secondary" noWrap component="p" title={details.path}>{details.path}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mt: 0.15 }}>{item.date} · {item.time}</Typography>
      </Box>
      {details.safe && <ArrowOutwardRoundedIcon aria-hidden="true" sx={{ fontSize: 12, mt: 0.6, color: '#96a3b8' }} />}
    </Box>
  );
};

export const HistoryExporter: React.FC = () => {
  const [config, setConfig] = useState<OutputConfig>(() => normalizeOutputConfig(DEFAULT_OUTPUT_CONFIG));
  const [hydrated, setHydrated] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showSaveView, setShowSaveView] = useState(false);
  const [viewName, setViewName] = useState('');
  const [items, setItems] = useState<OutputHistoryItem[] | null>(null);
  const [loaded, setLoaded] = useState<{ time: number; range: DateRange } | null>(null);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [uniqueUrls, setUniqueUrls] = useState(false);
  const [stripQuery, setStripQuery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      storageService.get<unknown>(StorageKey.OutputConfig),
      storageService.get<unknown>(SAVED_VIEWS_KEY),
    ]).then(([saved, views]) => {
      if (active) { setConfig(normalizeOutputConfig(saved)); setSavedViews(normalizeViews(views)); setHydrated(true); }
    });
    return () => { active = false; controllerRef.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => { void storageService.set(StorageKey.OutputConfig, config); }, 300);
    return () => window.clearTimeout(timer);
  }, [config, hydrated]);

  const filteredItems = useMemo(() => filterHistory(items ?? [], { query, domain, uniqueUrls, stripQuery }), [items, query, domain, uniqueUrls, stripQuery]);
  const summary = useMemo(() => summarizeHistory(items ?? []), [items]);
  const domains = useMemo(() => {
    const values = new Set<string>();
    (items ?? []).forEach((item) => { const host = getDomain(item.url); if (host) values.add(host); });
    if (domain) values.add(domain);
    return Array.from(values).sort();
  }, [items, domain]);
  const filtersActive = !!query.trim() || !!domain || uniqueUrls;
  const fieldsValid = Object.values(config.fields).some(Boolean);
  const customValid = config.historyRange !== 'custom' || !!(config.dateRange
    && Number.isFinite(config.dateRange.startTime) && Number.isFinite(config.dateRange.endTime)
    && config.dateRange.startTime <= config.dateRange.endTime);
  const exportEnabled = hydrated && !loading && customValid && fieldsValid && (items === null || filteredItems.length > 0);

  useEffect(() => { if (previewRef.current) previewRef.current.scrollTop = 0; }, [query, domain, uniqueUrls, stripQuery]);

  const updateConfig = (updates: Partial<OutputConfig>) => {
    if ('historyRange' in updates || 'dateRange' in updates) {
      setItems(null); setLoaded(null); setError(null);
    }
    setNotice(null);
    setConfig((previous) => {
      const next = { ...previous, ...updates };
      if (next.historyRange !== 'custom') next.dateRange = null;
      return next;
    });
  };

  const saveView = () => {
    const name = viewName.trim();
    if (!name || !customValid || !fieldsValid) return;
    const existing = savedViews.find((view) => view.name.toLowerCase() === name.toLowerCase());
    const view: SavedView = { id: existing?.id ?? `${Date.now()}`, name, config: normalizeOutputConfig(config), query, domain, uniqueUrls, stripQuery };
    const views = [view, ...savedViews.filter((saved) => saved.id !== view.id)].slice(0, 12);
    setSavedViews(views); void storageService.set(SAVED_VIEWS_KEY, views);
    setShowSaveView(false); setViewName(''); setNotice(`Saved “${name}”. Return to these settings with one click.`);
  };
  const applyView = (view: SavedView) => {
    setConfig(normalizeOutputConfig(view.config)); setQuery(view.query); setDomain(view.domain);
    setUniqueUrls(view.uniqueUrls); setStripQuery(view.stripQuery); setItems(null); setLoaded(null); setError(null);
    setNotice(`“${view.name}” is ready. Preview or export to read the current history.`);
  };
  const removeView = (id: string) => {
    const views = savedViews.filter((view) => view.id !== id);
    setSavedViews(views); void storageService.set(SAVED_VIEWS_KEY, views);
  };

  const clearFilters = () => { if (loading) return; setQuery(''); setDomain(''); setUniqueUrls(false); setNotice(null); };

  const shareHistoryOut = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(STORE_URL);
      setShareCopied(true);
    } catch {
      setShareFallback(true);
    }
  };

  const run = async (exportAfterLoad: boolean) => {
    if (loading || !customValid || !hydrated) return;
    setError(null); setNotice(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      let source = items;
      if (source === null || !exportAfterLoad) {
        setLoading(true); setProgress(null);
        const range = config.historyRange === 'custom' ? config.dateRange! : getRangeFromType(config.historyRange);
        const history = await historyService.getHistory(range, { signal: controller.signal });
        if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        let lastProgressUpdate = 0;
        source = await historyService.prepareHistoryItems(history, range, {
          signal: controller.signal,
          onProgress: (done, total) => {
            const now = performance.now();
            if (done === 0 || done === total || now - lastProgressUpdate >= 100) {
              lastProgressUpdate = now;
              setProgress({ done, total });
            }
          },
        });
        if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        setItems(source); setLoaded({ time: Date.now(), range });
      }
      if (exportAfterLoad) {
        const result = filterHistory(source, { query, domain, uniqueUrls, stripQuery });
        if (result.length === 0) {
          setNotice(source.length === 0 ? 'No visits found in this date range.' : 'No visits match your filters. Try clearing them.');
          return;
        }
        exportService.exportData(result, config.format, config.fields);
        setNotice(`${config.format.toUpperCase()} download started · ${number(result.length)} ${uniqueUrls ? 'pages' : 'visits'}.`);
      }
    } catch (err) {
      if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        setNotice('Preview cancelled. Your browsing history is unchanged.');
      } else {
        setError(err instanceof Error ? err.message : 'History could not be loaded. Please try again.');
      }
    } finally {
      if (controllerRef.current === controller) { setLoading(false); setProgress(null); controllerRef.current = null; }
    }
  };

  return (
    <Box component="main" aria-label="HistoryOut history exporter" sx={{ p: 2, pb: 0 }}>
      <Stack component="header" direction="row" spacing={1.2} alignItems="center" sx={{ pb: 2 }}>
        <Box component="img" src="icons/icon48.png" alt="" sx={{ width: 41, height: 41, borderRadius: '11px', flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Typography component="h1" variant="h1">HistoryOut</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">Find your way back. Keep what matters.</Typography>
        </Box>
      </Stack>

      <Stack spacing={1.5}>
        <Box sx={card}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.4 }}>
            <Typography component="h2" variant="h2">Start with a time range</Typography>
            <Button size="small" disabled={loading || !hydrated} onClick={() => setShowSaveView(!showSaveView)} startIcon={<BookmarkAddOutlinedIcon sx={{ fontSize: '16px !important' }} />} sx={{ minHeight: 28, py: 0, px: 0.5, fontSize: '0.875rem' }}>Save view</Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <FormControl sx={{ flex: 1, minWidth: 0 }} disabled={loading || !hydrated}>
              <InputLabel id="time-range-label">History range</InputLabel>
              <Select labelId="time-range-label" id="time-range-select" value={config.historyRange} label="History range" onChange={(event) => updateConfig({ historyRange: event.target.value as HistoryRange })}>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="yesterday">Yesterday</MenuItem>
                <MenuItem value="day">Last 24 hours</MenuItem>
                <MenuItem value="week">Last 7 days</MenuItem>
                <MenuItem value="month">Last 30 days</MenuItem>
                <MenuItem value="all">All available history</MenuItem>
                <MenuItem value="custom">Custom dates</MenuItem>
              </Select>
            </FormControl>
            <Button variant={items === null ? 'contained' : 'outlined'} onClick={() => void run(false)} disabled={loading || !customValid || !hydrated} sx={{ px: 1.6, flexShrink: 0 }} startIcon={<SearchRoundedIcon sx={{ fontSize: '17px !important' }} />}>
              {items === null ? 'Preview' : 'Refresh'}
            </Button>
          </Stack>
          {config.historyRange === 'custom' && <Box sx={{ mt: 1.4 }}><DateRangePicker value={config.dateRange} onChange={(dateRange) => updateConfig({ dateRange })} disabled={loading} /></Box>}
          {config.historyRange === 'custom' && !customValid && <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mt: 0.7 }}>Choose a start and end date, in that order.</Typography>}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {config.historyRange === 'all' ? 'Only history your browser still retains is available. Deleted or expired visits cannot be recovered.' : 'Your history is read only when you preview or export.'}
          </Typography>
          {items === null && filtersActive && <Box sx={{ bgcolor: '#f1f4fb', p: 1, mt: 1.1, borderRadius: '7px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>Active on preview & export</Typography>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{[query.trim() ? `Search: “${query.trim()}”` : '', domain, uniqueUrls ? 'Latest visit per URL' : ''].filter(Boolean).join(' · ')}</Typography>
            <Button size="small" disabled={loading} onClick={clearFilters} sx={{ minHeight: 23, p: 0, mt: 0.2, fontSize: '0.75rem' }}>Reset filters</Button>
          </Box>}
          {showSaveView && <Box component="form" onSubmit={(event: React.FormEvent) => { event.preventDefault(); saveView(); }} sx={{ pt: 1.5 }}>
            <Stack direction="row" spacing={0.8}>
              <TextField autoFocus fullWidth disabled={loading} label="View name" value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="Research, daily recap…" slotProps={{ htmlInput: { maxLength: 40 } }} />
              <Button type="submit" variant="outlined" disabled={loading || !viewName.trim() || !customValid || !fieldsValid}>Save</Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.7 }}>Saves your range, filters and export settings on this device. Your history is never saved here.</Typography>
          </Box>}
          {savedViews.length > 0 && <Box sx={{ mt: 1.2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.6 }}>Your saved views</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {savedViews.map((view) => <Chip key={view.id} label={view.name} disabled={loading} size="small" variant="outlined" onClick={() => applyView(view)} onDelete={() => removeView(view.id)} deleteIcon={<CloseRoundedIcon aria-label={`Delete saved view ${view.name}`} />} title={`Load saved view: ${view.name}`} sx={{ maxWidth: '100%', fontSize: '0.75rem', borderColor: '#dce3ed', '& .MuiChip-deleteIcon': { fontSize: 14 } }} />)}
            </Box>
          </Box>}
        </Box>

        {loading && <Box sx={card} role="status" aria-live="polite">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
            <Typography variant="body2" fontWeight={650}>{progress ? `Reading ${number(progress.done)} of ${number(progress.total)} pages…` : 'Finding your history…'}</Typography>
            <Button size="small" onClick={() => controllerRef.current?.abort()} sx={{ minWidth: 0, minHeight: 28, px: 0.6 }}>Cancel</Button>
          </Stack>
          <LinearProgress variant={progress && progress.total ? 'determinate' : 'indeterminate'} value={progress && progress.total ? progress.done / progress.total * 100 : undefined} sx={{ height: 4, borderRadius: 4 }} />
        </Box>}

        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
        {notice && <Alert severity={notice.includes('download started') ? 'success' : 'info'} onClose={() => setNotice(null)}>{notice}</Alert>}

        {items !== null && !loading && <>
          <Box sx={card}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography component="h2" variant="h2">{config.historyRange === 'today' ? "Today's recap" : config.historyRange === 'yesterday' ? "Yesterday's recap" : 'Your browsing recap'}</Typography>
              <Typography variant="caption" color="text.secondary">{loaded ? new Date(loaded.range.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Selected range'}</Typography>
            </Stack>
            <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} aria-label="Loaded history summary">
              {[{ value: summary.visits, label: 'visits' }, { value: summary.uniquePages, label: 'pages' }, { value: summary.domains, label: 'sites' }].map(({ value, label }) => <Box key={label} sx={{ flex: 1, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.28rem', lineHeight: 1.2, fontWeight: 750, letterSpacing: '-0.04em' }}>{number(value)}</Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Box>)}
            </Stack>
            {loaded && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.2, fontSize: '0.75rem', textAlign: 'center' }}>Loaded {new Date(loaded.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · Refresh for new visits</Typography>}
            {summary.topDomains.length > 0 && <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.6 }}>Most visited sites <Box component="span" sx={{ color: '#8a97ad' }}>· click to explore</Box></Typography>
              <Stack spacing={0.55}>
                {summary.topDomains.slice(0, 3).map((site) => <Button key={site.domain} size="small" fullWidth onClick={() => { setDomain(domain === site.domain ? '' : site.domain); setNotice(null); }} aria-pressed={domain === site.domain} sx={{ justifyContent: 'space-between', minHeight: 27, py: 0.3, px: 0.8, bgcolor: domain === site.domain ? '#e7edff' : '#f5f7fc', color: domain === site.domain ? 'primary.main' : 'text.primary', fontSize: '0.875rem' }}><Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.domain}</Box><Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem', ml: 1 }}>{number(site.visits)} visits</Box></Button>)}
              </Stack>
            </Box>}
          </Box>

          {items.length > 0 ? <Box sx={{ ...card, p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 1.5, pb: 1.1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.1 }}>
                <Stack direction="row" spacing={0.7} alignItems="center"><TuneRoundedIcon sx={{ color: 'primary.main', fontSize: 17 }} /><Typography component="h2" variant="h2">Your recent trail</Typography></Stack>
                {filtersActive && <Button size="small" disabled={loading} onClick={clearFilters} sx={{ minHeight: 24, p: 0, fontSize: '0.75rem' }}>Reset filters</Button>}
              </Stack>
              <TextField
                fullWidth placeholder="Search titles or URLs" value={query}
                onChange={(event) => { setQuery(event.target.value); setNotice(null); }}
                slotProps={{ htmlInput: { 'aria-label': 'Search history titles or URLs' }, input: {
                  startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 19, color: '#8a97ad' }} /></InputAdornment>,
                  endAdornment: query ? <InputAdornment position="end"><IconButton aria-label="Clear search" size="small" onClick={() => { setQuery(''); setNotice(null); }}><CloseRoundedIcon sx={{ fontSize: 16 }} /></IconButton></InputAdornment> : undefined,
                } }}
              />
              <FormControl fullWidth sx={{ mt: 1 }}>
                <Select value={domain} displayEmpty onChange={(event) => { setDomain(event.target.value); setNotice(null); }} inputProps={{ 'aria-label': 'Filter by website' }} sx={{ '& .MuiSelect-select': { py: 0.85 } }} MenuProps={{ PaperProps: { sx: { maxHeight: 350 } } }}>
                  <MenuItem value="">All websites</MenuItem>
                  {domains.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControlLabel control={<Checkbox checked={uniqueUrls} onChange={(event) => { setUniqueUrls(event.target.checked); setNotice(null); }} />} label={<Typography variant="body2">One row per URL <Box component="span" sx={{ color: 'text.secondary' }}>· latest visit</Box></Typography>} sx={{ ml: -0.6, mr: 0, mt: 0.7 }} />
            </Box>
            <Box sx={{ bgcolor: '#fafbfe', borderTop: '1px solid', borderColor: 'divider', px: 1.5, pt: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.1 }}>
                <Typography variant="caption" role="status" aria-live="polite" sx={{ fontWeight: 700, color: 'primary.main' }}>{number(filteredItems.length)} {uniqueUrls ? 'pages' : 'visits'} ready</Typography>
                <Typography variant="caption" color="text.secondary">Newest first</Typography>
              </Stack>
              {filteredItems.length ? <Box component="ul" ref={previewRef} tabIndex={0} aria-label="History preview" sx={{ p: 0, m: 0, listStyle: 'none', maxHeight: 248, overflowY: 'auto', pr: 0.3 }}>
                {filteredItems.slice(0, PREVIEW_LIMIT).map((item, index) => <PreviewRow key={`${item.id}-${item.order}-${index}`} item={item} />)}
              </Box> : <Box sx={{ py: 3, textAlign: 'center' }} role="status"><Typography variant="body2" fontWeight={650}>No matching visits</Typography><Typography variant="caption" color="text.secondary">Try a different search or clear your filters.</Typography><Button size="small" disabled={loading} onClick={clearFilters} sx={{ display: 'block', mx: 'auto', mt: 0.8 }}>Clear filters</Button></Box>}
              {filteredItems.length > PREVIEW_LIMIT && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 0.8, borderTop: '1px solid', borderColor: 'divider' }}>Previewing {number(PREVIEW_LIMIT)} of {number(filteredItems.length)}. Your export includes every match.</Typography>}
            </Box>
          </Box> : <Box sx={{ ...card, textAlign: 'center', py: 2.7 }} role="status">
            <HistoryRoundedIcon sx={{ fontSize: 29, color: '#9ba9c0', mb: 0.6 }} />
            <Typography variant="h2" component="h2">No visits in this range</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>Try a wider date range. Your browser may no longer have older visits.</Typography>
          </Box>}
        </>}

        {items === null && !loading && <Box sx={{ px: 1.25, py: 1.4 }}>
          <Typography sx={{ fontSize: '1.36rem', fontWeight: 750, letterSpacing: '-0.045em', lineHeight: 1.25, maxWidth: 250 }}>Your browsing history.<br /><Box component="span" sx={{ color: 'primary.main' }}>Ready to work with.</Box></Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 300 }}>Pick up your research, revisit a useful page, or review your day. Preview your history to explore, or go straight to export.</Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 1.4, flexWrap: 'wrap', gap: 0.5 }}>{['Daily recap', 'Saved views', 'CSV · JSON · HTML'].map((label) => <Chip key={label} label={label} variant="outlined" size="small" sx={{ height: 23, borderColor: '#dce3f0', color: '#65738b', fontSize: '0.75rem' }} />)}</Stack>
        </Box>}

        <Box sx={card}>
          <OutputSettings config={config} onConfigChange={updateConfig} disabled={loading || !hydrated} />
          <Divider sx={{ my: 1.2 }} />
          <FormControlLabel disabled={loading} control={<Checkbox checked={stripQuery} onChange={(event) => { setStripQuery(event.target.checked); setNotice(null); }} />} label={<Typography variant="body2">Remove URL queries & fragments</Typography>} sx={{ ml: -0.6, mr: 0 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 3.4 }}>Removes everything after ? and #. This does not anonymize your history.</Typography>
        </Box>

        <Stack direction="row" justifyContent="center" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary', py: 0.4 }}>
          <LockOutlinedIcon sx={{ fontSize: 12 }} />
          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>Free. On your device. No account needed.</Typography>
        </Stack>
        <Stack component="footer" direction="row" justifyContent="center" alignItems="center" sx={{ pb: 1.5, flexWrap: 'wrap', columnGap: 1.7, rowGap: 0.5 }}>
          <Link href={`${STORE_URL}/support`} target="_blank" rel="noopener noreferrer" variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Get help</Link>
          <Link href={`${STORE_URL}/reviews`} target="_blank" rel="noopener noreferrer" variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Leave a review</Link>
          <Button size="small" onClick={() => void shareHistoryOut()} sx={{ minHeight: 30, minWidth: 0, p: 0, color: 'text.secondary', fontWeight: 400, fontSize: '0.75rem' }}>Tell a friend</Button>
          <Tooltip title="An optional contribution to this free project. Opens Buy Me a Coffee." describeChild>
            <Link href="https://www.buymeacoffee.com/saulius.developer" target="_blank" rel="noopener noreferrer" variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Support HistoryOut</Link>
          </Tooltip>
        </Stack>
      </Stack>

      <Snackbar open={shareCopied} autoHideDuration={6000} onClose={() => setShareCopied(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" role="status" onClose={() => setShareCopied(false)} sx={{ maxWidth: 440 }}>Link copied. Paste it anywhere to share HistoryOut.</Alert>
      </Snackbar>
      <Dialog open={shareFallback} onClose={() => setShareFallback(false)} aria-labelledby="share-historyout-title" fullWidth maxWidth="sm">
        <DialogTitle id="share-historyout-title">Share HistoryOut</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Copy this link and paste it anywhere to share HistoryOut.</Typography>
          <TextField fullWidth autoFocus label="Installation link" value={STORE_URL} onFocus={(event) => event.target.select()} slotProps={{ htmlInput: { readOnly: true, 'aria-label': 'HistoryOut installation link' } }} />
        </DialogContent>
        <DialogActions><Button onClick={() => setShareFallback(false)}>Done</Button></DialogActions>
      </Dialog>

      <Box sx={{ position: 'sticky', bottom: 0, mx: -2, px: 2, pt: 1.2, pb: 1.25, bgcolor: 'rgba(245,247,251,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid', borderColor: 'divider', zIndex: 3 }}>
        <Button fullWidth variant="contained" disabled={!exportEnabled} onClick={() => void run(true)} startIcon={<ArrowDownwardRoundedIcon sx={{ fontSize: '18px !important' }} />} sx={{ minHeight: 42 }} aria-busy={loading}>
          {items === null ? 'Export history' : `Export ${number(filteredItems.length)} ${uniqueUrls ? 'pages' : 'visits'}`}
          <Box component="span" sx={{ ml: 1, fontSize: '0.75rem', opacity: 0.8 }}>{config.format.toUpperCase()}</Box>
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 0.6, fontSize: '0.75rem' }}>
          {items === null ? 'Downloads directly to your device' : stripQuery ? 'URL cleanup applied · preview matches your export' : 'Your file includes only the matching results'}
        </Typography>
      </Box>
    </Box>
  );
};
