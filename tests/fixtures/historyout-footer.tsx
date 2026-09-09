        <Stack component="footer" direction="row" justifyContent="center" alignItems="center" sx={{ pb: 1.5, flexWrap: 'wrap', columnGap: 1.7, rowGap: 0.5 }}>
          <Link href={`mailto:${product.contactEmail}`} target="_blank" rel="noopener noreferrer" variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Contact Saulius</Link>
          <Link href={`${STORE_URL}/reviews`} target="_blank" rel="noopener noreferrer" variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Leave a review</Link>
          <Button size="small" onClick={() => void shareHistoryOut()} sx={{ minHeight: 30, minWidth: 0, p: 0, color: 'text.secondary', fontWeight: 400, fontSize: '0.75rem' }}>Tell a friend</Button>
          <Tooltip title="An optional contribution to this free project. Opens Buy Me a Coffee." describeChild>
            <Link href="https://www.buymeacoffee.com/saulius.developer" target="_blank" rel="noopener noreferrer" variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Support HistoryOut</Link>
          </Tooltip>
        </Stack>
