# TryggNära

Mobilappen för vårt innovationsprojekt. Byggd med React Native, Expo och TypeScript.

## Installera

På datorn:

- [Node.js](https://nodejs.org/) – välj **LTS**. På Windows, ladda ner **Windows Installer (.msi)** och kör installationen. npm följer med.
- [Git](https://git-scm.com/downloads)
- [Visual Studio Code](https://code.visualstudio.com/)

På telefonen:

- **Expo Go** från App Store eller Google Play.

## Hämta projektet

```sh
git clone https://github.com/Allzii/shelter-app.git
cd shelter-app
```

Öppna sedan mappen `shelter-app` i VS Code via **File → Open Folder**.

## Installera projektets paket

Kör i terminalen, från mappen `shelter-app`:

```sh
npm ci
```

Kopiera `.env.example` till `.env.local` och fyll i projektets publika
Supabase-URL och nyckel innan du startar appen.

### Windows / PowerShell

Om du får ett fel om att `npm.ps1` inte får köras, använd `npm.cmd` i stället för `npm` och `npx.cmd` i stället för `npx`:

```powershell
npm.cmd ci
```

## Logga in på Expo

För iPhone behöver Expo Go och datorns terminal vara inloggade på samma Expo-konto. Skapa ett gratis konto på [expo.dev/signup](https://expo.dev/signup) och logga in i Expo Go.

På datorn:

```sh
npx expo login
```

I Windows PowerShell:

```powershell
npx.cmd expo login
```

## Starta appen

Anslut datorn och telefonen till samma wifi. Kör:

```sh
npx expo start --lan
```

I Windows PowerShell:

```powershell
npx.cmd expo start --lan
```

När QR-koden visas:

- **iPhone:** skanna med Kamera och öppna länken i Expo Go.
- **Android:** skanna via Expo Go.

Låt terminalen vara igång medan du testar. Stoppa servern med **Ctrl + C**.

Nästa gång räcker det att öppna projektmappen och köra startkommandot igen. Paketen behöver inte installeras varje gång.

## Hämta nya ändringar

Stoppa servern och kör följande i projektmappen:

```sh
git pull
npm ci
npx expo start --lan
```

I Windows PowerShell:

```powershell
git pull
npm.cmd ci
npx.cmd expo start --lan
```

Om du själv har ändrat kod, committa dina ändringar innan du kör `git pull`.

## Hitta i koden

- `src/app/` – Expo Routers sidor och navigation.
- `src/features/helper/` – skärmar och komponenter för volontärer.
- `src/features/recipient/` – skärmar och komponenter för den som får hjälp.
- `src/features/registration/` – gemensamma skärmar för verifiering och behörigheter.
- `src/components/ui/` – återanvändbara fält, knappar, profilrader och rubriker.
- `src/components/maps/` – kartvyer och skyddsrumskort. `.native.tsx` används på telefonen; `.tsx` är webbversionen.
- `src/hooks/` – gemensam React-logik, bland annat omladdning när en skärm visas.
- `src/services/` – hämtning och bearbetning av externa data, till exempel skyddsrum.
- `src/constants/`, `src/types/`, `src/utils/` – gemensamma val, datatyper och formattering.
- `docs/design/` – sparade designreferenser.

Lägg gemensamma formulärdelar i `components/ui` och rollspecifika delar i respektive
`features`-mapp. Alternativens ID:n i `constants/help-options.ts` används även i
sparade profiler och ska behållas när texter eller ikoner ändras.

## Kontrollera ändringar

```sh
npm run format
npm run check
```

`format` formaterar koden med Prettier. `check` kör TypeScript, ESLint och
kontrollerar formatteringen. I PowerShell kan du använda `npm.cmd`.

Lokala säkerhetskopior ligger i `backups/` och följer inte med i Git.

Adressbaserade uppdragsavstånd och deras databasändring beskrivs i
[docs/address-distances.md](docs/address-distances.md).

Bekräftat avslut av uppdrag aktiveras med
`supabase/confirm-help-completion.sql` i projektets SQL Editor. Volontären ber om
bekräftelse; kontot som skapade förfrågan bekräftar eller anger att hjälp
fortfarande behövs. SQL-filen inkluderar även återöppning när volontären avbryter.
