# Avstånd till registrerad adress

Uppdragskorten kan visa ungefärligt avstånd fågelvägen från volontärens
telefonposition till den hjälpsökandes registrerade adress. Det är inte
gångavstånd eller spårning av den hjälpsökandes telefon.

## Aktivering

Databasändringen finns i
`supabase/migrations/20261116091030_recipient_address_distances.sql`.
Den ska köras i **TryggNära-projektet**, efter kontroll av dess befintliga schema.
Appens projekt anges av `EXPO_PUBLIC_SUPABASE_URL` i `.env.local`.
Migreringen är testad i isolerad PostgreSQL med simulerade Supabase-roller.

Migreringen lägger till en tabell, ägarbegränsade RLS-policyer och en RPC för
avstånd. Befintliga profiler, kontakt-RPC:er, tillgänglighetsregler och
förfrågningstriggers ändras inte.

Efter aktivering:

1. Öppna den hjälpsökandes hemskärm på iOS eller Android. Adressen söks upp och
   positionen sparas. Detta gäller även befintliga profiler och registrering för
   någon annan; registrerarens telefonposition används aldrig som destination.
2. Android behöver platsbehörighet även för adressökning. Vid behov finns länken
   **Aktivera avstånd till din/personens adress** på hemskärmen.
3. En godkänd och tillgänglig volontär öppnar Hem eller Uppdrag och tillåter
   platsåtkomst. Korten uppdateras med **Ca 350 m**, **Ca 1,2 km** eller
   **Under 50 m** där underlag finns.

Ingen siffra visas när adressen är ofullständig, inte kan hittas entydigt eller
har för dålig precision. Volontärens position måste ha en angiven noggrannhet
inom 100 meter. Native adressökning har motsvarande precisionskontroll där
operativsystemet anger noggrannhet. Webbversionen kan visa avstånd till redan
sparade adresspositioner, men skapar inte nya via native adressökning.

## Åtkomst och uppdatering

- Endast profilens ägare kan läsa eller spara adresspositionen direkt.
- RPC:n lämnar bara ut förfrågans ID och ett avstånd avrundat till 50 meter.
- Godkänt intyg krävs. Väntande uppdrag kräver tillgänglighet och får inte vara
  skapade av volontären själv. Accepterade uppdrag är bara åtkomliga för den
  tilldelade volontären, även om volontären pausar.
- Inställda uppdrag lämnar inga avstånd.
- En SHA-256-fingeravtryckskontroll mot aktuell adress stoppar gamla positioner
  direkt vid adressändring, även om en äldre adressökning håller på att sparas.
- Korten behåller befintlig sortering efter skickad tid. Avstånd uppdateras var
  30:e sekund och telefonpositionen var minut medan fliken är fokuserad och appen
  är i förgrunden. Uppdatering sker också när appen återgår till förgrunden.

## Kontroller

```sh
npm run check
npm run test:distances
```

Databastestet kräver PostgreSQL-verktygen. På Windows används som standard
`C:/Program Files/PostgreSQL/18/bin`; en annan installation kan anges med
miljövariabeln `PG_BIN`. Testet startar en separat, tillfällig databas med
påhittade poster och kan inte ansluta till projektets riktiga databas.

Gör också ett test på två telefoner efter aktivering: rätt adress och avstånd,
nekad platsbehörighet, adressändring, accept, paus och avbryt.
