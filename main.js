let app;

function preload() {
  app = new F1App();
}

function setup() {
  app.setup();
}

function windowResized() {
  app.windowResized();
}

function draw() {
  let dt = deltaTime / 1000;

  app.update(dt);
  app.draw();
  app.postDraw();
}

function mousePressed() {
  app.mousePressed();
}

function togglePopup() {
  const popup = document.getElementById('popup');
  popup.classList.toggle('open');
}

function addRaceEntry(raceName, sessionId) {
  const raceList = document.getElementById('race-list');
  const raceEntry = document.createElement('div');
  raceEntry.classList.add('race-entry');
  raceEntry.textContent = raceName;

  raceEntry.onclick = (function (sId) {
    return function () {
      localStorage.setItem('sessionId', sId);
      location.reload();
    };
  })(sessionId);

  raceList.appendChild(raceEntry);

}