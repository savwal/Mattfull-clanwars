function initGDPR() {
  if (!localStorage.getItem('gdprAccepted')) {
    const modalHtml = `
      <div id="gdprModal" class="modal" style="z-index: 9999; display: block;">
        <div class="modal-content card" style="border-color: #E74C3C; box-shadow: 8px 8px 0px #E74C3C; background: #FFF;">
          <h2 style="background: #E74C3C; margin: -25px -25px 20px -25px; padding: 15px;">Användaravtal</h2>
          <div style="text-align: left; font-size: 14px; color: #2C3E50; font-weight: bold; line-height: 1.5; margin-bottom: 20px;">
            <p>För att använda Måttfull måste du godkänna vår hantering av din data. Vi följer svensk GDPR-lagstiftning.</p>
            <p>Följande information lagras:</p>
            <ul class="gdpr-list" style="list-style-type: disc; padding-left: 20px; box-shadow: none; border: none; background: transparent;">
              <li style="border: none; padding: 5px 0;">Namn, vikt, kön, profilbild och e-postadress.</li>
              <li style="border: none; padding: 5px 0;">Din dryckeshistorik under ett rullande kalenderår.</li>
              <li style="border: none; padding: 5px 0;">Dina vänner, klannamn, strider (battles) och antagna utmaningar.</li>
            </ul>
          </div>
          <button onclick="acceptGDPR()" style="background: #2ECC71; color: #FFF; width: 100%;">Jag Accepterar</button>
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

document.addEventListener("DOMContentLoaded", initGDPR);