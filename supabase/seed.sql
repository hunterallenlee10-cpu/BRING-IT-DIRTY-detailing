-- Demo rows matching the reference dashboard. Timestamps are relative to now() in America/New_York.
-- Run with: npm run seed  (or paste into the Supabase SQL editor)
delete from public.leads where phone like '(___) 555-01__';

with tz as (select 'America/New_York'::text as z),
local_today as (select (now() at time zone (select z from tz))::date as d),
next_dow as (
  -- next date (today or later) with the given ISO weekday whose hh:mm is still ahead
  select dow, hhmm,
    (select ((d + ((dow - extract(isodow from d)::int + 7) % 7)) + hhmm)
            + case when ((d + ((dow - extract(isodow from d)::int + 7) % 7)) + hhmm) < (now() at time zone (select z from tz)) then interval '7 days' else interval '0' end
       from local_today) as local_ts
  from (values (4, time '10:00'), (5, time '12:00'), (6, time '09:00')) v(dow, hhmm)
)
insert into public.leads (created_at, name, phone, vehicle, service, kind, slot_start, source, status, follow_up, follow_up_at, est_price, message)
values
  (now() - interval '2 days 3 hours', 'Alex M.',  '(301) 555-0188', 'sedan', 'wash',    'booking',
     ((select local_ts from next_dow where dow = 6) at time zone (select z from tz)), 'google',    'booked', '✓ Reminder scheduled', now() - interval '2 days 3 hours', 129, null),
  (now() - interval '1 day 5 hours',  'Karim B.', '(240) 555-0142', 'sedan', 'polish',  'booking',
     ((select local_ts from next_dow where dow = 5) at time zone (select z from tz)), 'instagram', 'booked', '✓ Reminder scheduled', now() - interval '1 day 5 hours', 349, null),
  (now() - interval '1 day 2 hours',  'Sophie L.','(301) 555-0127', 'coupe', 'ceramic', 'quote',   null, 'google',  'quote', 'Follow-up tomorrow', null, 899,
     'Can I get a quote for ceramic on my coupe? It has a few rock chips.'),
  (now() - interval '1 hour',         'Jason T.', '(240) 555-0163', 'truck', 'wash',    'booking',
     (((select d from local_today) + time '13:30') at time zone (select z from tz)), 'website', 'booked', '✓ Confirmed by text', now() - interval '55 minutes', 170, null),
  (now() - interval '12 minutes',     'Nadia R.', '(301) 555-0109', 'suv',   'polish',  'question', null, 'chatgpt', 'new', '✓ Auto-reply sent', now() - interval '11 minutes 57 seconds', null,
     'Do you remove swirl marks on black paint? How long does it take?'),
  (now() - interval '20 seconds',     'Daniel Reyes','(240) 555-0171', 'coupe', 'ceramic', 'booking',
     ((select local_ts from next_dow where dow = 4) at time zone (select z from tz)), 'website', 'booked', '✓ Text sent in 4s', now() - interval '16 seconds', 899, null);
