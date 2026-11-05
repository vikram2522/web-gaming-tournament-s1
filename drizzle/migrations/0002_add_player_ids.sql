ALTER TABLE public.registrations ADD COLUMN player_ids text[];
COMMENT ON COLUMN public.registrations.player_ids IS 'In-game ID for each player, same order as players';

CREATE OR REPLACE FUNCTION public.register_team(_team_name text, _captain text, _phone text, _players text[], _payment_path text, _player_ids text[] DEFAULT NULL)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _slot int;
BEGIN
  LOCK TABLE public.registrations IN EXCLUSIVE MODE;
  IF array_length(_players, 1) IS NULL OR array_length(_players, 1) NOT BETWEEN 4 AND 5 THEN
    RAISE EXCEPTION 'Enter 4 or 5 players';
  END IF;
  IF _player_ids IS NULL OR array_length(_player_ids, 1) <> array_length(_players, 1) OR EXISTS (SELECT 1 FROM unnest(_player_ids) AS id WHERE btrim(id) = '') THEN
    RAISE EXCEPTION 'Enter the in-game ID for every player';
  END IF;
  IF _payment_path IS NULL OR _payment_path !~ '^[0-9a-f-]{36}\.(png|jpg|jpeg|webp)$' THEN
    RAISE EXCEPTION 'Payment screenshot is required';
  END IF;
  SELECT s INTO _slot FROM generate_series(1, 12) s
    WHERE s NOT IN (SELECT slot_number FROM public.registrations) ORDER BY s LIMIT 1;
  IF _slot IS NULL THEN RAISE EXCEPTION 'All slots are filled'; END IF;
  INSERT INTO public.registrations(slot_number, team_name, captain, phone, players, player_ids, payment_path)
    VALUES (_slot, trim(_team_name), trim(_captain), trim(_phone), _players, (SELECT array_agg(btrim(id)) FROM unnest(_player_ids) AS id), _payment_path);
  RETURN _slot;
END $function$;

GRANT EXECUTE ON FUNCTION public.register_team(text, text, text, text[], text, text[]) TO anon, authenticated, service_role;