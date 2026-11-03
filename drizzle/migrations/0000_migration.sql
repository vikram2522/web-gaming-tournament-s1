CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_number int NOT NULL UNIQUE CHECK (slot_number BETWEEN 1 AND 12),
  team_name text NOT NULL CHECK (char_length(team_name) BETWEEN 1 AND 60),
  captain text NOT NULL CHECK (char_length(captain) BETWEEN 1 AND 60),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 10 AND 15),
  players text[] NOT NULL,
  payment_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.list_teams()
RETURNS TABLE(slot_number int, team_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT slot_number, team_name FROM public.registrations ORDER BY slot_number;
$$;

CREATE OR REPLACE FUNCTION public.register_team(_team_name text, _captain text, _phone text, _players text[], _payment_path text)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _slot int;
BEGIN
  LOCK TABLE public.registrations IN EXCLUSIVE MODE;
  IF array_length(_players, 1) IS NULL OR array_length(_players, 1) NOT BETWEEN 4 AND 5 THEN
    RAISE EXCEPTION 'Enter 4 or 5 players';
  END IF;
  IF _payment_path IS NULL OR _payment_path !~ '^[0-9a-f-]{36}\.(png|jpg|jpeg|webp)$' THEN
    RAISE EXCEPTION 'Payment screenshot is required';
  END IF;
  SELECT s INTO _slot FROM generate_series(1, 12) s
    WHERE s NOT IN (SELECT slot_number FROM public.registrations) ORDER BY s LIMIT 1;
  IF _slot IS NULL THEN RAISE EXCEPTION 'All slots are filled'; END IF;
  INSERT INTO public.registrations(slot_number, team_name, captain, phone, players, payment_path)
    VALUES (_slot, trim(_team_name), trim(_captain), trim(_phone), _players, _payment_path);
  RETURN _slot;
END $$;

REVOKE ALL ON FUNCTION public.list_teams() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_team(text, text, text, text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_teams() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_team(text, text, text, text[], text) TO anon, authenticated;