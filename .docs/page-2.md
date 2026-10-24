The standard PostgreSQL tool for backing up a database is **`pg_dump`**.

---

### 1. Recommended: Custom Compressed Format (`.dump`)
This format is compressed, flexible, and allows selective or parallel restoration with `pg_restore`:

```bash
# Using a connection URL (matching your .env)
pg_dump -F c -f reddit_tracker.dump "postgresql://fil@localhost:5432/reddit_tracker"

# Or using standard flags:
pg_dump -h localhost -p 5432 -U fil -d reddit_tracker -F c -f reddit_tracker.dump
```

**To restore:**
```bash
pg_restore -d reddit_tracker reddit_tracker.dump
# Or with clean recreation of objects:
pg_restore --clean -d reddit_tracker reddit_tracker.dump
```

---

### 2. Plain SQL Text Format (`.sql`)
Produces a human-readable SQL script containing `CREATE TABLE`, `INSERT`, etc.:

```bash
pg_dump "postgresql://fil@localhost:5432/reddit_tracker" > reddit_tracker.sql
```

**To restore:**
```bash
psql "postgresql://fil@localhost:5432/reddit_tracker" < reddit_tracker.sql
# Or:
psql -d reddit_tracker -f reddit_tracker.sql
```

---

### 3. Common Useful Options

| Flag | Purpose | Example |
| :--- | :--- | :--- |
| `-s`, `--schema-only` | Dump only the schema (DDL), no data | `pg_dump -s -d reddit_tracker > schema.sql` |
| `-a`, `--data-only` | Dump only data (table rows), no schema | `pg_dump -a -d reddit_tracker > data.sql` |
| `-t`, `--table=NAME` | Dump a specific table only | `pg_dump -t "User" -d reddit_tracker > user.sql` |
| `-n`, `--schema=NAME`| Dump a specific PostgreSQL schema | `pg_dump -n public -d reddit_tracker > public.sql` |

---

### 4. Back Up Entire Cluster (All DBs + Users & Roles)
If you need all databases along with global roles and permissions, use **`pg_dumpall`**:

```bash
pg_dumpall -h localhost -U postgres > full_cluster_backup.sql
```