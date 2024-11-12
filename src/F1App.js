class F1App {
    constructor() {
        this.dataManager = new DataManager();
        this.normalVisualizer = new NormalVisualizer()
    }

    setup() {
        this.isPlaying = false;
        this.isLive = false;

        this.setupHTMLElements();

        let sessionId = localStorage.getItem('sessionId');

        if (sessionId) {
            this.dataManager.sessionKey = sessionId;
        } else {
            this.dataManager.sessionKey = "latest";
        }

        this.dataManager.setup();
        this.normalVisualizer.setup();

        this.leftMouseClicked = false;
    }

    update(dt) {
        this.updateControlsUI(dt);

        this.dataManager.update(dt);
        this.normalVisualizer.update(dt);
    }

    draw() {
        this.normalVisualizer.draw();
    }

    postDraw() {
        this.leftMouseClicked = false;
    }

    windowResized() {
        resizeCanvas(this.leftCanvasWidth, this.visualizationDiv.clientHeight, false);
        this.canvas2.resizeCanvas(this.visualizationDiv.clientWidth - this.leftCanvasWidth, this.visualizationDiv.clientHeight, false);
    }

    mousePressed() {
        if (mouseButton === LEFT) {
            this.leftMouseClicked = true;
        }
    }

    updateControlsUI(dt) {
        {
            this.playButton.html(this.isPlaying ? '❚❚' : '►');
            if (this.isPlaying) {
                if (this.isLive) {
                    this.currentTime = new Date();
                } else {
                    this.currentTime = new Date(this.currentTime.getTime() + dt * 1000);
                }
            }
        }
        {
            if (this.currentTime && this.dateStart) {
                let hours = this.currentTime.getHours() - this.dateStart.getHours();
                let minutes = this.currentTime.getMinutes() - this.dateStart.getMinutes();
                let seconds = this.currentTime.getSeconds() - this.dateStart.getSeconds();

                // this.currentTimeLable.html(`${hours.toString().padStart(2, 0)}:${minutes.toString().padStart(2, 0)}:${seconds.toString().padStart(2, 0)}`);
            }
        }
        {
            const minValue = this.timeSlider.elt.min;
            const maxValue = this.timeSlider.elt.max;
            const sliderValue = ((this.timeSlider.value() - minValue) / (maxValue - minValue)) * 100;
            this.timeSlider.elt.style.setProperty('--slider-value', `${sliderValue}%`);
        }
    }

    setupHTMLElements() {
        this.visualizationDiv = document.getElementById("visualization");
        this.controlsDiv = document.getElementById("controls");

        this.playButton = createButton('►');
        this.playButton.parent("time-controls-left-container");
        this.playButton.id("playButton");
        this.playButton.class("play-button");
        this.playButton.mousePressed(() => this.isPlaying = !this.isPlaying);

        // this.currentTimeLable = createSpan("00:00:00");
        // this.currentTimeLable.parent("time-controls-left-container");
        // this.currentTimeLable.id("timeLable");
        // this.currentTimeLable.class("time-lable");

        // this.liveButton = createButton('LIVE');
        // this.liveButton.parent("time-controls-right-container");
        // this.liveButton.id("liveButton");
        // this.liveButton.class("live-button");
        // this.liveButton.mousePressed(() => {
        //     this.isPlaying = true;
        //     this.isLive = true;
        // });

        // Create the first canvas and set its visibility
        this.canvas1 = createCanvas(this.visualizationDiv.clientWidth / 2, this.visualizationDiv.clientHeight);
        this.canvas1.parent(this.visualizationDiv);
        this.canvas1.class("visualization-canvas")

        // Create the second canvas using createGraphics()
        this.canvas2 = createGraphics(this.visualizationDiv.clientWidth / 2, this.visualizationDiv.clientHeight);
        this.canvas2.parent(this.visualizationDiv);
        this.canvas2.class("visualization-canvas")
        this.canvas2.style("display", "");

        this.timeSlider = createSlider(0, 1);
        this.timeSlider.id("time-slider");
        this.timeSlider.parent("time-slider-container");
        this.timeSlider.input(() => this.currentTime = new Date(this.timeSlider.value()));

        const stop = function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        };

        document.querySelectorAll('input[type="range"]').forEach((input) => {
            input.draggable = true;
            input.addEventListener('dragstart', stop);
        });
    }

    sessionChanged() {
        if (!this.dataManager.rawSessionData) {
            return;
        }

        this.dateStart = new Date(this.dataManager.rawSessionData.date_start);
        this.dateEnd = new Date(this.dataManager.rawSessionData.date_end);

        this.timeSlider.attribute('min', this.dateStart.getTime());
        this.timeSlider.attribute('max', this.dateEnd.getTime());
        this.currentTime = this.dateStart;
        this.dataManager.loadTrackGeoJsonData();
    }

    updateAvailableRaces() {
        let races = this.dataManager.allRacesData;

        for (let i in races) {
            let raceData = races[i];
            addRaceEntry(`${raceData.year} ${raceData.country_name}-${raceData.location}`, raceData.session_key);
        }
    }
}

function toISO8601Milliseconds(dateISO) {
    return dateISO.substring(0, dateISO.length - 1);
}
