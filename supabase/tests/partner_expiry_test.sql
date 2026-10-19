SELECT test_date,
  public.partner_sponsorship_expiry(test_date) = expected AS passed
FROM (VALUES
  (DATE '2026-12-18', TIMESTAMPTZ '2026-12-18 23:59:59.999999+00'),
  (DATE '2026-07-18', TIMESTAMPTZ '2026-07-18 22:59:59.999999+00'),
  (DATE '2026-03-29', TIMESTAMPTZ '2026-03-29 22:59:59.999999+00'),
  (DATE '2026-10-25', TIMESTAMPTZ '2026-10-25 23:59:59.999999+00')
) AS cases(test_date, expected);