function initGDPR() {
  if (!localStorage.getItem('gdprAccepted')) {
    const modalHtml = `
      <div id="gdprModal" class="modal" style="z-index: 10001; display: block;">
        <div class="card" style="margin: 5% auto; width: 90%; max-width: 500px; border-color: #E74C3C; box-shadow: 8px 8px 0px #E74C3C; background: #FFF;">
          <h2 style="background: #E74C3C; margin: -20px -20px 20px -20px; padding: 15px;">Användaravtal</h2>
          <div id="gdprBody" style="text-align: left; font-size: 14px; color: #2C3E50; font-weight: bold; line-height: 1.5; margin-bottom: 20px; max-height: 60vh; overflow-y: auto;">
            <p>Välkommen till redlös – din personliga drinklogg med statistik, events och vänleaderboards.</p>
            <p><strong>Viktigt:</strong> Allt innehåll är endast för underhållning och är <em>inte</em> medicinsk rådgivning eller en hälsorekommendation.</p>
            <p><strong>Användaransvar:</strong> Du är fullt ansvarig för all din aktivitet och alla dina handlingar medan du använder redlös. Du accepterar att din användning av tjänsten är helt på ditt eget ansvar.</p>
            <p>För att använda redlös måste du godkänna vår hantering av din data. Vi följer svensk GDPR-lagstiftning.</p>
            <p><strong>Funktioner du kan använda:</strong></p>
            <ul style="list-style-type: disc; padding-left: 20px; margin: 10px 0;">
              <li style="padding: 5px 0;">Logga drycker och se promillegraf.</li>
              <li style="padding: 5px 0;">Jämför med vänner och event.</li>
              <li style="padding: 5px 0;">Spara profiler och hashkod.</li>
            </ul>
            <p><strong>Följande information lagras:</strong></p>
            <ul style="list-style-type: disc; padding-left: 20px; margin: 10px 0;">
              <li style="padding: 5px 0;">Namn, vikt, kön och profilbild.</li>
              <li style="padding: 5px 0;">Din dryckeshistorik.</li>
              <li style="padding: 5px 0;">Dina vänner, klannamn, strider (battles) och antagna utmaningar.</li>
            </ul>
            <p><strong>Dataskydd & Tredje part:</strong> All data bevaras säkert och kommer varken att säljas eller lämnas ut till några tredje parter.</p>
            <p><strong>Lokal webblagring:</strong> Vi använder lokal webblagring (localStorage) för att spara dina preferenser och sessionsdata lokalt på din enhet för en bättre användarupplevelse.</p>
            <p><strong>Notiser:</strong> Appen kan visa lokala påminnelser om att logga fler drycker. Dessa notiser skapas lokalt på din enhet och fungerar endast när appen är igång. De är endast en påminnelse och inte medicinsk rådgivning.</p>
            <p><strong>Immateriell egendom:</strong> Alla funktioner och features på redlös är skapade inom kreativa gränser. All immateriell egendom och upphovsrätt tillhör redlös-ägarna.</p>
            <p><strong>Ansvarsbegränsning:</strong> redlös.se är inte ansvarigt för någon skada, förlust eller påföljd som uppstår från din användning av tjänsten. Du samtycker att du inte kan väcka juridisk talan eller stämning mot skaparna eller ägarna av redlös.</p>
            <p><strong>Rättslig grund:</strong> Vi behandlar dina uppgifter baserat på ditt samtycke (Art. 6(1)(a) GDPR).</p>
            <p><strong>Kontakt:</strong> Vid frågor eller felrapportering, kontakta oss på <a href="mailto:redls@redls.se" style="color: #2A8CFF;">redls@redls.se</a>.</p>
          </div>
          <div id="gdprButtons" style="display: flex; gap: 10px; margin-top: 15px;">
            <button onclick="rejectGDPR()" style="background: #E74C3C; color: #FFF; width: 100%; margin: 0;">Avböj</button>
            <button onclick="acceptGDPR()" style="background: #2ECC71; color: #FFF; width: 100%; margin: 0;">Jag Accepterar</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }
}

function acceptGDPR() {
  localStorage.setItem('gdprAccepted', 'true');
  const modal = document.getElementById('gdprModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function rejectGDPR() {
  localStorage.removeItem('gdprAccepted');
  var body = document.getElementById('gdprBody');
  var buttons = document.getElementById('gdprButtons');
  if (body) {
    body.innerHTML =
      '<div style="text-align: center; padding: 20px 0;">' +
        '<p style="font-size: 1.2em; margin-bottom: 15px;">Tack för ditt besök!</p>' +
        '<p>Du måste godkänna användaravtalet för att kunna använda redlös.</p>' +
        '<p style="margin-top: 15px;">Vid frågor, kontakta oss på <a href="mailto:redls@redls.se" style="color: #2A8CFF;">redls@redls.se</a>.</p>' +
      '</div>';
  }
  if (buttons) {
    buttons.style.display = 'none';
  }
}

document.addEventListener("DOMContentLoaded", initGDPR);