#!/usr/bin/env bash
# Double-booking race against real Postgres: N parallel book_slot() calls for one slot with bays=1.
# Expect exactly one success. Usage: DATABASE_URL=postgres://... bash tests/sql/race.sh [N]
set -euo pipefail
N="${1:-8}"
DB="${DATABASE_URL:?set DATABASE_URL}"
SLOT="2030-01-07T15:00:00Z"
psql "$DB" -qtAc "delete from public.leads where slot_start = '$SLOT'"
for i in $(seq 1 "$N"); do
  psql "$DB" -qtAc "select id from public.book_slot('{\"name\":\"Racer $i\",\"phone\":\"(301) 555-01$((10 + i))\",\"vehicle\":\"suv\",\"service\":\"wash\",\"slot_start\":\"$SLOT\",\"source\":\"test\"}'::jsonb, 1)" >/tmp/race_$i.out 2>&1 &
done
wait
OK=$(grep -lE '^[0-9a-f-]{36}$' /tmp/race_*.out | wc -l)
FULL=$(grep -l 'slot_full' /tmp/race_*.out | wc -l)
ROWS=$(psql "$DB" -qtAc "select count(*) from public.leads where slot_start = '$SLOT'")
rm -f /tmp/race_*.out
echo "parallel=$N succeeded=$OK slot_full=$FULL rows_in_db=$ROWS"
[ "$OK" = 1 ] && [ "$ROWS" = 1 ] && [ "$FULL" = $((N - 1)) ] && echo "PASS: exactly one booking" || { echo "FAIL"; exit 1; }
