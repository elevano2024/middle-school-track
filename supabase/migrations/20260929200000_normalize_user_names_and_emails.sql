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
UPDATE auth.users
SET email = btrim(email)
WHERE email <> btrim(email);

UPDATE public.profiles
SET email = btrim(email)
WHERE email <> btrim(email);

UPDATE public.students
SET email = btrim(email)
WHERE email IS NOT NULL
  AND email <> btrim(email);

-- 3. Correct the misspelled school domain. Matched on the exact bad domain so this
--    cannot touch correctly spelled addresses.
UPDATE auth.users
SET email = replace(email, '@rsingsunmontessori.org', '@risingsunmontessori.org')
WHERE email LIKE '%@rsingsunmontessori.org';

UPDATE public.profiles
SET email = replace(email, '@rsingsunmontessori.org', '@risingsunmontessori.org')
WHERE email LIKE '%@rsingsunmontessori.org';

UPDATE public.students
SET email = replace(email, '@rsingsunmontessori.org', '@risingsunmontessori.org')
WHERE email LIKE '%@rsingsunmontessori.org';
