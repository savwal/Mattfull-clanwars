Redlös: Måttfull fast rolig

"Logga drycker, se din promille, variabel Fun Zone-gräns, Psychosonen." 

## Start
Kort översikt av appen och vad den används till.
- Logga drycker och se beräknad promille.
- Sätt en variabel Fun Zone-gräns och se när du passerar Psychosonen.
- Jämför dig med vänner i Battles och följ utvecklingen över tid i Wrapped.

## Profil
Allt som beskriver dig som spelare och används i beräkningar.
- Namn: visas i profiler, loggar och jämförelser.
- Vikt: används för promilleberäkning.
- Kön: används för promilleberäkning.
- Player hash: unik ID för delning och battles. Kan ändras till en valfri kombination av 5 tecken (alla symboler tillåtna).

## Registrering
Uppstart för nya användare.
- Skapa profil med namn, vikt och kön.
- Välj eller generera player hash.
- Bekräfta startvärden för Fun Zone-gräns.

## Logging
Huvudmeny för allt som gäller alkohollogg.
- Snabbvalsmeny: snabbval för vanliga drycker.
	- Lägg till standardval: The Bear, Brooklyn Lager, Guinness.
	- Stöd för 50 cl för Guinness i snabbvalen.
- Logg: namn för visning i UI (tidigare Krog).
- Enheter: namn för visning i UI (tidigare Stridslogg).
- Twilightzone: namn för visning i UI (tidigare Underfunzone).
- Visa historik för dagens och veckans intag.

## Alkoholintag
Beräkning och förklaring av alkoholeffekt.
- Promilleberäkning baserad på profil och logg.
- Fun Zone-gräns: dynamisk gräns för när det känns ok.
- Psychosonen: varning vid hög promille.
- Tydliga indikatorer för övergång mellan zoner.

## Wrapped (Månad/År)
Sammanfattningar av användning över tid.
- Månatlig Wrapped: mest loggad dryck, antal enheter, toppdagar.
- Årlig Wrapped: total mängd, frekvens, personliga rekord.
- Jämförelse med tidigare perioder.

## Battles
Social jämförelse.
- Ta bort single player-läge.
- Jämför mot vänner baserat på loggar.
- Visar vinnare per period och total status.

## ELO-system
Rankingmotorn för Battles.
- Elo beräknas per utmaning/vecka/månad.
- Vinst vid seger mot högre rang.
- Stabilisering med minimumkamper för placering.

## Filer per funktion
Översikt över vilka filer som används i varje del av appen.

### Logg (Start)
- index.html
- features/log/scripts/graph.js
- features/log/scripts/drinkLogger.js
- features/log/scripts/main.js
- features/shared/scripts/gdpr.js
- features/shared/scripts/shared.js
- features/shared/scripts/calculator.js

### Battles
- features/battles/pages/battles.html
- features/shared/scripts/hash.js
- features/shared/scripts/shared.js

### Events
- features/events/pages/events.html
- features/shared/scripts/hash.js
- features/shared/scripts/shared.js
- features/shared/scripts/calculator.js

### Klan
- features/clans/pages/clans.html
- features/shared/scripts/hash.js
- features/shared/scripts/shared.js

### Vänner
- features/friends/pages/friends.html
- features/shared/scripts/hash.js
- features/shared/scripts/shared.js
- features/shared/scripts/calculator.js

### Profil
- features/profile/pages/profile.html
- features/shared/scripts/hash.js
- features/shared/scripts/shared.js

### Registrering
- features/register/pages/register.html
- features/shared/scripts/hash.js
- features/shared/scripts/shared.js

### Wrapped
- features/wrapped/pages/wrapped.html
- features/shared/scripts/shared.js
- features/wrapped/scripts/wrappedLogic.js

### Rankings (borttagen)
- features/rankings/pages/rankings.html
