# Database & Storage Internals — Perf-Scout Strategy Lens

> **When to load this lens**: custom storage/query/index code, in-memory stores,
> scans/filters/joins/aggregations, write-heavy paths, on-disk/serialized formats,
> or app code that leans heavily on a database.
>
> **Where these ideas come from**: database and storage-engine internals
> (Postgres, SQLite, RocksDB/LevelDB, DuckDB, ClickHouse, Lucene). These systems
> spent decades making "find and combine data" fast; their techniques transfer to
> any code that stores, indexes, scans, or joins. Every entry is a *candidate*
> hypothesis, not a proven win. Cite `file:line`, attribute the source, give a
> validation path. (For app-side query *usage* like N+1, see the I/O lens — this
> lens is about storage/query *internals* and patterns.)

## Detection signals (where this lens might apply — not proof)
- In-memory collections scanned linearly to filter/find/join on a hot path.
- Custom on-disk or serialized storage formats; hand-rolled indexes.
- Write-heavy paths doing in-place random updates.
- Aggregations/group-bys/joins implemented row-at-a-time in app code.
- Repeated membership tests against a large set, especially on a slow store.
- Range/prefix/sorted queries served by full scans.
- Large datasets where only a few columns/fields are ever touched.

## Strategies

### 1. Add the right index (and covering indexes)
- **Borrowed from**: B-tree/hash indexing.
- **The idea**: build an index matching the query's predicate (equality → hash, range/sort → ordered tree), and make it *covering* so the query is answered from the index without touching the base data.
- **Code signals**: linear scans filtering on a stable key; queries that read a few fields after a lookup.
- **Speculative win**: a scan could drop toward an O(log n)/O(1) lookup if the predicate is selective; a covering index may avoid the base-row fetch.
- **Cost / risk**: index memory and write-time maintenance.
- **Validate by**: query plan / lookup count; benchmark — benchmark or profile.

### 2. Probabilistic membership filter before the expensive lookup
- **Borrowed from**: LSM-tree SSTables (RocksDB attaches a per-SSTable bloom or, since 6.15, ribbon filter), caches.
- **The idea**: keep a compact probabilistic membership filter so likely-absent keys skip the expensive disk/network lookup entirely. Bloom is cheapest to build; ribbon/quotient variants trade more build CPU for ~27% less memory at the same false-positive rate.
- **Code signals**: many lookups that miss on a slow store; checking existence before a costly fetch.
- **Speculative win**: removes most negative lookups from the slow path.
- **Cost / risk**: false positives (tunable); filter memory and build/maintenance CPU.
- **Validate by**: negative-lookup rate; slow-store hits before/after.

### 3. Columnar layout + vectorized execution
- **Borrowed from**: OLAP engines (DuckDB, ClickHouse, Arrow).
- **The idea**: store fields column-wise and process them in batches/vectors (DuckDB ~1–2K values, ClickHouse blocks up to 65,536) so scans touch only needed columns and run SIMD-friendly per-column kernels. Vectorized execution amortizes per-row interpreter overhead with precompiled kernels — distinct from JIT-compiling the whole query plan to machine code (an alternative model; ClickHouse adds JIT as an optional optimization, DuckDB stays vectorized).
- **Code signals**: row-oriented storage scanned for analytics over a few fields; aggregate/filter over many rows row-at-a-time.
- **Speculative win**: less data scanned, better compression, vectorizable operators.
- **Cost / risk**: poor fit for row-at-a-time OLTP access; row-reconstruction cost.
- **Validate by**: bytes/columns scanned; scan/aggregate benchmark vs row-at-a-time.

### 4. LSM-tree write batching for write-heavy paths
- **Borrowed from**: LevelDB/RocksDB/Cassandra.
- **The idea**: buffer writes in memory and flush sequentially (append-only), compacting in the background, instead of random in-place updates.
- **Code signals**: write-heavy workload doing random in-place updates; write amplification.
- **Speculative win**: could turn random writes into sequential ones and raise write throughput if the path is write-bound and read amplification stays tolerable.
- **Cost / risk**: read amplification and compaction overhead; tuning.
- **Validate by**: write throughput; read latency under compaction.

### 5. Predicate / projection pushdown
- **Borrowed from**: query optimizers, Parquet/columnar readers.
- **The idea**: apply filters and select columns as early/low as possible (at the storage/scan layer) so less data flows up the pipeline.
- **Code signals**: load-everything-then-filter; full objects fetched to use a subset.
- **Speculative win**: less data materialized, transferred, and processed.
- **Cost / risk**: pushing logic into the storage layer; coverage limits.
- **Validate by**: rows/bytes after pushdown; pipeline timing.

### 6. Better join strategy
- **Borrowed from**: relational query execution (hash join, sort-merge join).
- **The idea**: replace a nested-loop join with a hash join (build a hash table on the smaller side, probe with the larger) or a sort-merge join when inputs are already sorted, for large joins done in app code.
- **Code signals**: `for a: for b: if a.key == b.key` — nested-loop join over big collections.
- **Speculative win**: O(n·m) → ~O(n+m) for hash; ~O(n log n + m log m) for sort-merge if sorting is needed, ~O(n+m) if already sorted.
- **Cost / risk**: build-side memory (hash); sort cost (sort-merge); both degrade with key skew.
- **Validate by**: benchmark across input sizes.

### 7. Partition pruning
- **Borrowed from**: partitioned tables, time-series databases.
- **The idea**: organize data into partitions (by time/key range) and skip whole partitions that can't match a query.
- **Code signals**: scanning all data when queries are bounded by time/range; growing scan cost over time.
- **Speculative win**: skips most of the dataset for bounded queries.
- **Cost / risk**: partition scheme must match query patterns; cross-partition queries.
- **Validate by**: partitions scanned per query; timing.

### 8. Compression / encoding (dictionary, RLE, delta)
- **Borrowed from**: columnar stores, time-series compression.
- **The idea**: encode data compactly (dictionary-encode repeated values, run-length for runs, delta for sequences) to shrink scans and fit more in cache/memory.
- **Code signals**: large low-cardinality or sequential datasets stored verbosely.
- **Speculative win**: less data to scan/transfer; sometimes operate directly on encoded form.
- **Cost / risk**: encode/decode CPU; random access into encoded blocks.
- **Validate by**: size reduction; scan benchmark on encoded data.

### 9. Append-only / sequential write design
- **Borrowed from**: write-ahead logs, event logs, journaling.
- **The idea**: write sequentially (append) and treat the log as the source of truth, deriving state from it — sequential I/O is far faster than random on both SSD and disk.
- **Code signals**: random in-place file/record updates; scattered small writes.
- **Speculative win**: sequential throughput; simpler durability/crash recovery.
- **Cost / risk**: compaction/snapshotting to bound size; read-path derivation.
- **Validate by**: write throughput; recovery correctness.

### 10. MVCC / snapshot reads instead of read locks
- **Borrowed from**: snapshot isolation (Postgres keeps new row versions in-table + VACUUM; InnoDB keeps the latest in-table and reconstructs old versions from undo logs).
- **The idea**: keep versioned data so readers see a consistent snapshot without blocking writers (and vice versa), removing reader-writer lock contention.
- **Code signals**: read locks blocking writers (or the reverse) on a hot store; lock contention between reads and writes.
- **Speculative win**: readers and writers might stop blocking each other if contention is genuinely reader-writer (not write-write).
- **Cost / risk**: version storage and garbage collection (Postgres bloat / InnoDB undo growth); complexity.
- **Validate by**: contention/off-CPU profiling; concurrency benchmark.

### 11. Precomputed / incremental aggregates (summary tables)
- **Borrowed from**: materialized aggregates, time-series rollups.
- **The idea**: maintain rollup/summary tables (counts, sums, histograms per bucket) updated incrementally on write, so aggregate queries read the summary instead of scanning raw rows.
- **Code signals**: expensive group-by/aggregate over raw rows per query.
- **Speculative win**: aggregate reads may become small lookups if queries align with the precomputed buckets.
- **Cost / risk**: summary maintenance on write; staleness if async.
- **Validate by**: aggregate query latency; rows scanned.

### 12. Zone maps / min-max indexes (data skipping)
- **Borrowed from**: ClickHouse skip indexes, Snowflake zone maps, Parquet row-group stats.
- **The idea**: store per-block min/max (and optionally null/count) metadata so a predicate can skip whole blocks whose range can't match — pruning before any data is read or decompressed. Cheap to maintain and most effective when data is sorted/clustered on the filtered column.
- **Code signals**: range/equality filters over large block-structured or chunked data; blocks read then fully discarded by a `WHERE`-style filter.
- **Speculative win**: skips most blocks for selective, range-correlated queries.
- **Cost / risk**: near-useless if values are randomly distributed across blocks (overlapping ranges); small metadata overhead.
- **Validate by**: blocks/row-groups pruned per query; bytes scanned before/after.

### 13. Late materialization (defer row reconstruction)
- **Borrowed from**: columnar OLAP execution (Vertica/C-Store lineage, DuckDB, Redshift).
- **The idea**: carry row IDs / position lists through filters and joins, fetching the non-predicate columns only for rows that survive — instead of assembling full rows up front (early materialization).
- **Code signals**: full objects/rows hydrated before filtering; expensive fields loaded for rows later discarded.
- **Speculative win**: avoids materializing columns for filtered-out rows; less memory and I/O on selective queries.
- **Cost / risk**: random-access tuple reconstruction can hurt for low-selectivity queries; more complex operators.
- **Validate by**: rows/columns materialized vs rows returned; query benchmark across selectivities.

### 14. Compressed bitmap index (roaring) for filtering
- **Borrowed from**: OLAP/search bitmap indexes (Druid, Pinot, Lucene; Roaring bitmaps).
- **The idea**: represent each value's matching row set as a compressed bitmap, then resolve multi-predicate filters with fast bitwise AND/OR/NOT over those bitmaps instead of scanning rows.
- **Code signals**: multi-attribute equality/set filters combined with AND/OR over a large dataset; repeated tag/category/flag filtering.
- **Speculative win**: filter resolution could reduce to bitwise set operations, cheaply intersecting many predicates, if cardinality is low-to-medium.
- **Cost / risk**: best for low-to-medium cardinality; index build/storage and update cost on writes.
- **Validate by**: rows scanned vs matched; multi-predicate filter benchmark.

### 15. Index intersection / multi-index AND (bitmap)
- **Borrowed from**: relational query optimizers — Postgres "Combining Multiple Indexes" (BitmapAnd / BitmapOr over per-index bitmaps), Oracle bitmap index AND.
- **The idea**: rather than one wide composite index per query shape, let the optimizer combine several single-column indexes at query time — scan each into an in-memory bitmap and AND/OR them — so a mix of queries touching different column subsets is served by a few reusable indexes instead of a combinatorial set of composites.
- **Code signals**: ad-hoc multi-column `WHERE` filters whose columns vary per query; many overlapping composite indexes maintained to cover every combination; one predicate indexed while another forces a residual scan.
- **Speculative win**: a multi-predicate filter might be answered by intersecting per-column bitmaps if each predicate is individually selective, avoiding both a full scan and a proliferation of composite indexes.
- **Cost / risk**: each extra index scan adds cost, so the planner may still prefer one composite or a single index; bitmap loses index ordering (an `ORDER BY` then needs a sort); maintaining several indexes costs write time.
- **Validate by**: query plan shows a BitmapAnd/intersection (not a full scan); rows scanned vs matched; benchmark vs a single composite index — profile with a benchmark or profiler.
