-- Normalize user-entered names and email addresses.
--
-- Roster data was pasted in by hand, which left three classes of bad data that all
-- break lookups teachers depend on:
--
--   1. Names containing a literal tab instead of a space ("Robert<TAB>Benedict IV").
--      Searching "Robert Benedict" in User Management never matched these students.
--   2. An email with trailing whitespace. Password recovery matches addresses
--      exactly, so a padded address fails as "user not found".
--   3. One misspelled domain (rsingsunmontessori.org), which cannot receive mail.
--
-- Every statement is idempotent and scoped by a WHERE clause, so re-running is safe.

-- 1. Collapse tabs and runs of whitespace in display names, then trim the result.
UPDATE public.profiles
SET full_name = btrim(regexp_replace(full_name, '\s+', ' ', 'g'))
WHERE full_name <> btrim(regexp_replace(full_name, '\s+', ' ', 'g'));

UPDATE public.students
SET name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
WHERE name <> btrim(regexp_replace(name, '\s+', ' ', 'g'));

-- 2. Trim whitespace from stored email addresses.
--
--    Email is unique on all three tables, so each rewrite skips any row whose
--    normalized value is already taken by a different row. Without that guard, two
--    addresses differing only by surrounding whitespace would collide and abort the
--    migration. Such rows are left untouched for manual resolution rather than
--    being silently merged.
UPDATE auth.users u
SET email = btrim(u.email)
WHERE u.email <> btrim(u.email)
  AND NOT EXISTS (
    SELECT 1 FROM auth.users other
    WHERE other.id <> u.id AND other.email = btrim(u.email)
  );

UPDATE public.profiles p
SET email = btrim(p.email)
WHERE p.email <> btrim(p.email)
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles other
    WHERE other.id <> p.id AND other.email = btrim(p.email)
  );

UPDATE public.students s
SET email = btrim(s.email)
WHERE s.email IS NOT NULL
  AND s.email <> btrim(s.email)
  AND NOT EXISTS (
    SELECT 1 FROM public.students other
    WHERE other.id <> s.id AND other.email = btrim(s.email)
  );

-- 3. Correct the misspelled school domain. Matched on the exact bad domain so this
--    cannot touch correctly spelled addresses, and guarded against collisions with
--    an account that already uses the corrected address.
UPDATE auth.users u
SET email = replace(u.email, '@rsingsunmontessori.org', '@risingsunmontessori.org')
WHERE u.email LIKE '%@rsingsunmontessori.org'
  AND NOT EXISTS (
    SELECT 1 FROM auth.users other
    WHERE other.id <> u.id
      AND other.email = replace(u.email, '@rsingsunmontessori.org', '@risingsunmontessori.org')
  );

UPDATE public.profiles p
SET email = replace(p.email, '@rsingsunmontessori.org', '@risingsunmontessori.org')
WHERE p.email LIKE '%@rsingsunmontessori.org'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles other
    WHERE other.id <> p.id
      AND other.email = replace(p.email, '@rsingsunmontessori.org', '@risingsunmontessori.org')
  );

UPDATE public.students s
SET email = replace(s.email, '@rsingsunmontessori.org', '@risingsunmontessori.org')
WHERE s.email LIKE '%@rsingsunmontessori.org'
  AND NOT EXISTS (
    SELECT 1 FROM public.students other
    WHERE other.id <> s.id
      AND other.email = replace(s.email, '@rsingsunmontessori.org', '@risingsunmontessori.org')
  );
