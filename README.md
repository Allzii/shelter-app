# AppNamn

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

Skapa `.env.local` i projektmappen med projektets publika Supabase-URL och nyckel:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_KEY=
```

Fyll i värdena innan du startar appen. Filen följer inte med i Git.

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
- `supabase/setup.sql` – installation av uppdrags- och armbandsfunktionerna.

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

Avstånd på uppdragskort beräknas från volontärens position till den
hjälpsökandes registrerade adress. Det kräver platsbehörighet och den
adressfunktion som redan har lagts in i projektets databas.

Databasfunktionerna finns samlade i `supabase/setup.sql`. Kör filen i det
befintliga app-projektets SQL Editor när funktionerna ska installeras. De tidigare
tre SQL-filerna ingår i samma ordning. En redan installerad databas behöver inte
uppdateras bara för att filerna har samlats ihop.

Volontären ber om bekräftelse när hjälpen är klar. Kontot som skapade förfrågan
bekräftar eller anger att hjälp fortfarande behövs. Om volontären avbryter öppnas
uppdraget igen för andra volontärer.

## Koppla ett armband till en person

Armbandskoden lämnas som ett enda paket: `output/armband-sos.zip`. Packa upp det
utanför app-projektet och spara de fyra Python-filerna på MicroPython-enheten via
Thonny. Kör sedan `main.py`. Paketet innehåller också installationsinstruktioner.

Öppna Armband i appen medan mobilen har internet. Välj personen om kontot har
flera registreringar och följ guiden. Välj **Behåll armbandets Wi-Fi** om nätverket
redan är inställt. När mobilen har internet igen: tryck **Spara armbandskopplingen**.
Först efter databasens bekräftelse visas att armbandet är kopplat.

Armbandet skapar sin egen identitet i `bracelet.json` på enheten. Behåll den
filen när Python-koden uppdateras; kopiera den inte till andra armband. Appen
sparar inte armbandets hemlighet lokalt. Databasen lagrar dess fingeravtryck i en
privat tabell, med en koppling per person och per armband.

## SOS från armbandet

Installera databasfunktionerna från `supabase/setup.sql` och armbandskoden från
zip-paketet ovan. Behåll övriga Python-filer samt armbandets sparade Wi-Fi och
identitet på enheten.

Håll inne knappen i 1,5 sekunder. Först när databasen bekräftat förfrågan visar
armbandet **SOS SANT**. Den visas då som en vanlig förfrågan i appen. En redan
aktiv förfrågan återanvänds. Varje nytt knapptryck har ett sparat händelse-ID så
att ett nätverksfel och nytt försök inte återöppnar ett avbrutet eller avslutat
uppdrag. Efter omstart kontrollerar armbandet den senaste händelsen utan att
automatiskt skapa en ny förfrågan.

Armbandet hämtar uppdragsstatus ungefär var tionde sekund medan det har internet.
Volontärens accept, återlämning, ägarens avbrytande och bekräftat avslut följer
appens befintliga regler. **EJ BEKR.** betyder att armbandet inte kan bekräfta
resultatet; kontrollera förfrågan i appen. Utan Wi-Fi före sändning visas
**EJ SANT**.

HTTPS verifierar serverns certifikat och värdnamn. `cloud_config.py` innehåller
bara projektets publika anslutningsuppgifter och en betrodd rot, inga
administratörsnycklar eller användarlösenord. Armbandet behöver rätt tid för TLS
och försöker ställa klockan via NTP om den inte redan är inställd. Kopplingen
autentiseras med armbandets egen hemlighet; den ger bara åtkomst till den
kopplade personens förfrågan. Befintliga testmarkeringar i databasen behålls.

Verifiera på två telefoner: skapa SOS, se förfrågan, acceptera, återlämna,
avbryt och slutför. Prova även avstängt internet, nytt försök och omstart. Den
fysiska hårdvaran och installationen i det riktiga projektet måste provas även
när lokala databas- och protokolltester passerar.
