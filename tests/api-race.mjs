// Double-booking race through the HTTP API: N parallel POST /api/bookings for one open slot (bays = 1).
// Usage: node tests/api-race.mjs [baseUrl] [N]
const base = process.argv[2] || "http://localhost:3000";
const N = +(process.argv[3] || 6);
const av = await (await fetch(`${base}/api/availability?days=14`)).json();
let pick = null;
for (const d of av.days.slice().reverse()) {
  const s = d.slots.find((x) => x.available && x.remaining === 1);
  if (s) { pick = { date: d.date, time: s.time }; break; }
}
if (!pick) throw new Error("no single-capacity slot free");
const body = (i) => JSON.stringify({ vehicle: "sedan", service: "wash", ...pick, name: `Racer ${i}`, phone: "(301) 555-0" + String(150 + i), source: "test" });
const res = await Promise.all(
  Array.from({ length: N }, (_, i) =>
    fetch(`${base}/api/bookings`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${i + 1}` }, body: body(i) }).then((r) => r.status),
  ),
);
const ok = res.filter((s) => s === 201).length, full = res.filter((s) => s === 409).length;
console.log(`slot ${pick.date} ${pick.time}: statuses ${res.join(",")}`);
console.log(ok === 1 && full === N - 1 ? "PASS: exactly one booking" : "FAIL");
process.exit(ok === 1 && full === N - 1 ? 0 : 1);
