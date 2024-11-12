const DATA_REQUEST_LONG_LONG_TIME = 15;
const DATA_REQUEST_LONG_TIME = 5;
const DATA_REQUEST_MEDIUM_TIME = 3;
const DATA_REQUEST_CONTINUOUS_TIME = 1;

const LOCAL_API_URL = "http://127.0.0.1:8000/v1/";
const PUBLIC_API_URL = "https://api.openf1.org/v1/";
const PUBLIC_API_TRACKS_URL = "https://api.multiviewer.app/api/v1/circuits/";

class DataManager {
    constructor() { }

    setup() {
        this.sessionDataUpdateTime = DATA_REQUEST_LONG_LONG_TIME;
        this.meetingDataUpdateTime = DATA_REQUEST_LONG_LONG_TIME;
        this.driversDataUpdateTime = DATA_REQUEST_LONG_TIME;
        this.raceControlDataUpdateTime = DATA_REQUEST_MEDIUM_TIME;
        this.positionDataUpdateTime = DATA_REQUEST_MEDIUM_TIME;
        this.locationDataUpdateTime = DATA_REQUEST_CONTINUOUS_TIME;
        this.stintsDataUpdateTime = DATA_REQUEST_LONG_LONG_TIME;
        this.intervalsDataUpdateTime = DATA_REQUEST_MEDIUM_TIME;
        this.lapsDataUpdateTime = DATA_REQUEST_MEDIUM_TIME;

        this.allRacesData = [];

        this.sessionDataFetchTimer = this.sessionDataUpdateTime;
        this.meetingDataFetchTimer = this.meetingDataUpdateTime;
        this.driversDataFetchTimer = this.driversDataUpdateTime;
        this.raceControlDataFetchTimer = this.raceControlDataUpdateTime;
        this.positionDataFetchTimer = this.positionDataUpdateTime;
        this.locationDataFetchTimer = this.locationDataUpdateTime;
        this.stintsDataFetchTimer = this.stintsDataUpdateTime;
        this.intervalsDataFetchTimer = this.intervalsDataUpdateTime;
        this.lapsDataFetchTimer = this.lapsDataUpdateTime;

        this.positionedDriverNumbers = [];
        this.dataByDriverNumber = {};
        this.raceControlData = Object();
        this.raceControlData.sectorFlags = [];
        this.raceControlData.messageStack = [];
        this.teamLogo = {};
        this.fastestLapLogo = null;

        this.trackGeoJsonData = null;

        this.currentLap = 1;
        this.fastestLap = null;

        this.rateLimitTimer = 0;
        this.rateLimit = 0.7;


        this.fetchAllRacesData();
        this.fetchSessionData();
        this.fetchMeetingData();
        this.fetchDriversData();

        this.flagImages = {};

        loadImage("./resources/images/fastest-lap.jpg", (img) => this.fastestLapLogo = img);
    }

    update(dt) {
        this.updateContinuousData(dt);

        // Update timers.
        this.sessionDataFetchTimer = min(this.sessionDataUpdateTime, this.sessionDataFetchTimer + dt);
        this.meetingDataFetchTimer = min(this.meetingDataUpdateTime, this.meetingDataFetchTimer + dt);
        this.driversDataFetchTimer = min(this.driversDataUpdateTime, this.driversDataFetchTimer + dt);
        this.raceControlDataFetchTimer = min(this.raceControlDataUpdateTime, this.raceControlDataFetchTimer + dt);
        this.positionDataFetchTimer = min(this.positionDataUpdateTime, this.positionDataFetchTimer + dt);
        this.locationDataFetchTimer = min(this.locationDataUpdateTime, this.locationDataFetchTimer + dt);
        this.stintsDataFetchTimer = min(this.stintsDataUpdateTime, this.stintsDataFetchTimer + dt);
        this.intervalsDataFetchTimer = min(this.intervalsDataUpdateTime, this.intervalsDataFetchTimer + dt);
        this.lapsDataFetchTimer = min(this.lapsDataUpdateTime, this.lapsDataFetchTimer + dt);

        this.rateLimitTimer += dt;
    }

    updateContinuousData(dt) {
        this.fetchRaceControlData();
        this.fetchPositionData();
        this.fetchLocationData();
        this.fetchStintsData();
        this.fetchIntervalsData();
        this.fetchLapsData();

        if (this.rawMeetingData) {
            if (!this.flagImages.hasOwnProperty(this.rawMeetingData.country_code)) {
                this.fetchFlagImage(this.rawMeetingData.country_code, 64);
            }
        }

        if (this.positionedDriverNumbers && this.dataByDriverNumber) {
            for (let i = 0; i < this.positionedDriverNumbers.length; i++) {
                let lap = this.dataByDriverNumber[this.positionedDriverNumbers[i]].lap_number;
                if (lap) {
                    this.currentLap = lap;
                    break;
                }
            }
        }
    }

    getRawSessionData() {
        if (!this.rawSessionData || this.rawSessionData.session_key != this.sessionKey) {
            this.fetchSessionData();
        }

        return this.rawSessionData;
    }

    getRawMeetingData() {
        let sessionData = this.getRawSessionData();
        if (!sessionData) {
            return;
        }

        if (!this.rawMeetingData || this.rawMeetingData.meeting_key != sessionData.meeting_key) {
            this.fetchMeetingData();
        }

        return this.rawMeetingData;
    }

    getDriversData() {
        let sessionData = this.getRawSessionData();
        if (!sessionData) {
            return;
        }

        if (!this.rawDriversData || this.rawDriversData[0].session_key != sessionData.session_key) {
            this.fetchDriversData();
        }

        return this.dataByDriverNumber;
    }

    async loadTrackGeoJsonData() {
        let request = `${PUBLIC_API_TRACKS_URL}${this.rawSessionData.circuit_key}/${this.rawSessionData.year}`;
        console.log(`Fetching track data: ${request}`);
        fetch(request)
            .then(response => response.json())
            .then(jsonContent => this.trackData = jsonContent)
            .then(data => {
                let length = min(data.x.length, data.y.length);
                let bboxTrack = [data.x[0], data.y[0], data.x[0], data.y[0]];
                for (let i = 0; i < length; i++) {
                    let vertexPos = [data.x[i], data.y[i]];

                    if (vertexPos[0] < bboxTrack[0]) {
                        bboxTrack[0] = vertexPos[0];
                    } else if (vertexPos[1] < bboxTrack[1]) {
                        bboxTrack[1] = vertexPos[1];
                    } else if (vertexPos[0] > bboxTrack[2]) {
                        bboxTrack[2] = vertexPos[0];
                    } else if (vertexPos[1] > bboxTrack[3]) {
                        bboxTrack[3] = vertexPos[1];
                    }
                }

                this.trackData.bboxTrack = bboxTrack;
            });

    }

    async fetchAllRacesData() {
        let request = `${PUBLIC_API_URL}sessions?session_type=Race&year>2023`;
        console.log(`Fetching all races data: ${request}`);
        fetch(request)
            .then(response => response.json())
            .then(jsonContent => this.allRacesData = jsonContent)
            .then(() => app.updateAvailableRaces())
    }

    async fetchSessionData() {
        if (this.rateLimitTimer < this.rateLimit) {
            return;
        }

        if (this.sessionDataFetchTimer < this.sessionDataUpdateTime || this.fetchingSessionData) {
            return;
        }

        this.sessionDataFetchTimer = 0;

        let request = `${PUBLIC_API_URL}sessions?session_key=${this.sessionKey}`;
        console.log(`Fetching session data: ${request}`);
        this.fetchingSessionData = true;
        try {
            this.rateLimitTimer = 0;
            fetch(request)
                .then(response => response.json())
                .then(jsonContent => {
                    this.rawSessionData = jsonContent[0]
                    this.sessionKey = this.rawSessionData.session_key;
                    app.sessionChanged();
                    this.fetchingSessionData = false;
                });
        }
        catch (e) {
            console.log(`ERROR WHEN FETCHIN: ${e}`);
        }
    }

    async fetchMeetingData() {
        if (this.rateLimitTimer < this.rateLimit) {
            return;
        }

        let sessionData = this.getRawSessionData();
        if (!sessionData) {
            return;
        }

        if (this.meetingDataFetchTimer < this.meetingDataUpdateTime) {
            return;
        }

        this.meetingDataFetchTimer = 0;

        let request = `${PUBLIC_API_URL}meetings?meeting_key=${sessionData.meeting_key}`;
        console.log(`Fetching meeting data: ${request}`);
        try {
            this.rateLimitTimer = 0;
            fetch(request)
                .then(response => response.json())
                .then(jsonContent => this.rawMeetingData = jsonContent[0]);
        } catch (e) {
            console.log(`ERROR WHEN FETCHIN: ${e}`);
        }
    }

    async fetchDriversData() {
        if (this.rateLimitTimer < this.rateLimit) {
            return;
        }

        let sessionData = this.getRawSessionData();
        if (!sessionData) {
            return;
        }

        if (this.driversDataFetchTimer < this.driversDataUpdateTime) {
            return;
        }

        this.driversDataFetchTimer = 0;

        let request = `${PUBLIC_API_URL}drivers?session_key=${sessionData.session_key}`;
        console.log(`Fetching drivers data: ${request}`);

        try {
            this.rateLimitTimer = 0;
            fetch(request)
                .then(response => response.json())
                .then(jsonContent => this.rawDriversData = jsonContent)
                .then(data => {
                    for (let i = 0; i < data.length; i++) {
                        this.dataByDriverNumber[data[i].driver_number] = { ...this.dataByDriverNumber[data[i].driver_number], ...data[i] };
                    }
                });
        } catch (e) {
            console.log(`ERROR WHEN FETCHIN: ${e}`);
        }
    }

    async fetchRaceControlData() {
        if (this.rateLimitTimer < this.rateLimit) {
            return;
        }

        let sessionData = this.getRawSessionData();
        if (!sessionData) {
            return;
        }

        if (this.raceControlDataFetchTimer < this.raceControlDataUpdateTime) {
            return;
        }

        this.raceControlDataFetchTimer = 0;

        let request = `${PUBLIC_API_URL}race_control?session_key=${sessionData.session_key}&date<${toISO8601Milliseconds(app.currentTime.toISOString())}`;
        if (this.lastRaceControlUpdatedDate) {
            if (this.lastRaceControlUpdatedDate.getTime() == app.currentTime.getTime()) {
                return;
            }

            if (this.lastRaceControlUpdatedDate.getTime() < app.currentTime.getTime()) {
                request += `&date>${toISO8601Milliseconds(this.lastRaceControlUpdatedDate.toISOString())}`;
            }
        }

        this.lastRaceControlUpdatedDate = new Date(app.currentTime);   // Update last updated time.
        console.log(`Fetching race control data: ${request}`);

        try {
            this.rateLimitTimer = 0;
            fetch(request)
                .then(response => response.json())
                .then(jsonContent => this.rawRaceControlData = jsonContent)
                .then(dataCollection => {
                    for (let i = 0; i < dataCollection.length; i++) {
                        let data = dataCollection[i];
                        let messageDate = new Date(data.date);
                        if (data.message != null && abs(messageDate.getTime() - app.currentTime.getTime()) / 1000 < 60) {
                            this.raceControlData.messageStack.push(data);
                        }

                        if (data.category == "Flag") {
                            if (data.scope == "Track") {
                                this.raceControlData.trackFlag = data.flag == "CLEAR" || data.flag == "GREEN" ? null : data.flag;
                            } else if (data.scope == "Sector") {
                                this.raceControlData.sectorFlags[data.sector] = data.flag == "CLEAR" ? null : data.flag;
                            }
                        }
                    }
                });
        } catch (e) {
            console.log(`ERROR WHEN FETCHIN: ${e}`);
        }
    }

    async fetchPositionData() {
        if (this.rateLimitTimer < this.rateLimit) {
            return;
        }

        let sessionData = this.getRawSessionData();
        if (!sessionData) {
            return;
        }

        if (this.positionDataFetchTimer < this.positionDataUpdateTime) {
            return;
        }

        this.positionDataFetchTimer = 0;

        let request = `${PUBLIC_API_URL}position?session_key=${sessionData.session_key}&date<${toISO8601Milliseconds(app.currentTime.toISOString())}`;
        if (this.lastPositionUpdatedDate) {
            if (this.lastPositionUpdatedDate.getTime() == app.currentTime.getTime()) {
                return;
            }

            if (this.lastPositionUpdatedDate.getTime() < app.currentTime.getTime()) {
                request += `&date>${toISO8601Milliseconds(this.lastPositionUpdatedDate.toISOString())}`;
            }
        }

        this.lastPositionUpdatedDate = new Date(app.currentTime);   // Update last updated time.
        console.log(`Fetching position data: ${request}`);

        try {
            this.rateLimitTimer = 0;
            fetch(request)
                .then(response => response.json())
                .then(jsonContent => this.rawPositionData = jsonContent)
                .then(data => {
                    for (let i = 0; i < data.length; i++) {
                        this.dataByDriverNumber[data[i].driver_number] = { ...this.dataByDriverNumber[data[i].driver_number], ...data[i] };
                        this.positionedDriverNumbers[data[i].position - 1] = data[i].driver_number;
                    }
                });
        } catch (e) {
            console.log(`ERROR WHEN FETCHIN: ${e}`);
        }
    }

    async fetchLocationData() {
        if (this.rateLimitTimer < this.rateLimit) {
            return;
        }

        let sessionData = this.getRawSessionData();
        if (!sessionData) {
            return;
        }

        if (this.locationDataFetchTimer < this.locationDataUpdateTime) {
            return;
        }

        if (this.lastLocationUpdatedDate && this.lastLocationUpdatedDate.getTime() == app.currentTime.getTime()) {
            return;
        }

        this.locationDataFetchTimer = 0;
        this.lastLocationUpdatedDate = new Date(app.currentTime);   // Update last updated time.
        let request = `${PUBLIC_API_URL}location?session_key=${sessionData.session_key}&date<${toISO8601Milliseconds(app.currentTime.toISOString())}&date>${toISO8601Milliseconds(new Date(app.currentTime.getTime() - 500).toISOString())}`;
        console.log(`Fetching location data: ${request}`);

        try {
            this.rateLimitTimer = 0;
            fetch(request)
                .then(response => response.json())
                .then(jsonContent => this.rawLocationData = jsonContent)
                .then(data => {
                    for (let i = 0; i < data.length; i++) {
                        this.dataByDriverNumber[data[i].driver_number] = { ...this.dataByDriverNumber[data[i].driver_number], ...data[i] };
                    }
                });
        } catch (e) {
            console.log(`ERROR WHEN FETCHIN: ${e}`);
        }
    }

    async fetchStintsData() {
        if (this.rateLimitTimer < this.rateLimit) {
            return;
        }

        let sessionData = this.getRawSessionData();
        if (!sessionData) {
            return;
        }

        if (this.stintsDataFetchTimer < this.stintsDataUpdateTime) {
            return;
        }

        this.stintsDataFetchTimer = 0;

        let request = `${PUBLIC_API_URL}stints?session_key=${sessionData.session_key}&lap_start<${this.currentLap + 1}`;
        if (this.lastStintsUpdatedDate) {
            if (this.lastStintsUpdatedDate.getTime() == app.currentTime.getTime()) {
                return;
            }
        }

        console.log(`Fetching stints data: ${request}`);
        this.lastStintsUpdatedDate = new Date(app.currentTime);   // Update last updated time.

        try {
            this.rateLimitTimer = 0;
            fetch(request)
                .then(response => response.json())
                .then(jsonContent => this.rawStintsData = jsonContent)
                .then(data => {
                    for (let i = 0; i < data.length; i++) {
                        this.dataByDriverNumber[data[i].driver_number] = { ...this.dataByDriverNumber[data[i].driver_number], ...data[i] };
                    }
                });
        } catch (e) {
            console.log(`ERROR WHEN FETCHIN: ${e}`);
        }
    }

    async fetchIntervalsData() {
        if (this.rateLimitTimer < this.rateLimit) {
            return;
        }

        let sessionData = this.getRawSessionData();
        if (!sessionData || sessionData.session_type != "Race") {
            return;
        }

        if (this.intervalsDataFetchTimer < this.intervalsDataUpdateTime) {
            return;
        }

        this.intervalsDataFetchTimer = 0;

        let request = `${PUBLIC_API_URL}intervals?session_key=${sessionData.session_key}&date<${toISO8601Milliseconds(app.currentTime.toISOString())}`;
        if (this.lastIntervalsUpdatedDate) {
            if (this.lastIntervalsUpdatedDate.getTime() == app.currentTime.getTime()) {
                return;
            }

            if (this.lastIntervalsUpdatedDate.getTime() < app.currentTime.getTime()) {
                request += `&date>${toISO8601Milliseconds(this.lastIntervalsUpdatedDate.toISOString())}`;
            }
        }

        console.log(`Fetching intervals data: ${request}`);
        this.lastIntervalsUpdatedDate = new Date(app.currentTime);   // Update last updated time.

        try {
            this.rateLimitTimer = 0;
            fetch(request)
                .then(response => response.json())
                .then(jsonContent => this.rawIntervalsData = jsonContent)
                .then(data => {
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].intervals == 0) {
                            continue;
                        }
                        this.dataByDriverNumber[data[i].driver_number] = { ...this.dataByDriverNumber[data[i].driver_number], ...data[i] };

                        if (!data[i].gap_to_leader) {
                            let a = 0;
                        }
                    }
                });
        } catch (e) {
            console.log(`ERROR WHEN FETCHIN: ${e}`);
        }
    }

    async fetchLapsData() {
        if (this.rateLimitTimer < this.rateLimit) {
            return;
        }

        let sessionData = this.getRawSessionData();
        if (!sessionData) {
            return;
        }

        if (this.lapsDataFetchTimer < this.lapsDataUpdateTime) {
            return;
        }

        this.lapsDataFetchTimer = 0;

        let resetData = true;
        let request = `${PUBLIC_API_URL}laps?session_key=${sessionData.session_key}&date_start<${toISO8601Milliseconds(app.currentTime.toISOString())}`;
        if (this.lastLapsUpdatedDate) {
            if (this.lastLapsUpdatedDate.getTime() == app.currentTime.getTime()) {
                return;
            }

            if (this.lastLapsUpdatedDate.getTime() < app.currentTime.getTime()) {
                resetData = false;
                request += `&date_start>${toISO8601Milliseconds(this.lastLapsUpdatedDate.toISOString())}`;
            }
        }

        console.log(`Fetching laps data: ${request}`);
        this.lastLapsUpdatedDate = new Date(app.currentTime);   // Update last updated time.

        try {
            this.rateLimitTimer = 0;
            fetch(request)
                .then(response => response.json())
                .then(jsonContent => this.rawLapsData = jsonContent)
                .then(data => {
                    if (resetData) {
                        this.currentLap = 1;
                        this.fastestLap = null;
                        this.fastestLapDriverNumber = null;

                        this.fastestDurationSector1 = null;
                        this.fastestDurationSector2 = null;
                        this.fastestDurationSector3 = null;

                        for (let i in this.dataByDriverNumber) {
                            let data = this.dataByDriverNumber[i];
                            data.duration_sector_1 = null;
                            data.duration_sector_2 = null;
                            data.duration_sector_3 = null;
                            data.lap_duration = null;
                            data.driver_fastest_lap = null;

                            data.fastest_driver_duration_sector1 = null;
                            data.fastest_driver_duration_sector2 = null;
                            data.fastest_driver_duration_sector3 = null;
                        }
                    }

                    for (let i = 0; i < data.length; i++) {
                        this.dataByDriverNumber[data[i].driver_number] = { ...this.dataByDriverNumber[data[i].driver_number], ...data[i] };
                        let driverData = this.dataByDriverNumber[data[i].driver_number];

                        if ((!this.fastestLap && driverData.lap_duration) || this.fastestLap && driverData.lap_duration && driverData.lap_duration < this.fastestLap) {
                            this.fastestLap = driverData.lap_duration;
                            this.fastestLapDriverNumber = driverData.driver_number;
                        }

                        if (!this.fastestDurationSector1 || driverData.duration_sector_1 < this.fastestDurationSector1) {
                            this.fastestDurationSector1 = driverData.duration_sector_1;
                        }

                        if (!this.fastestDurationSector2 || driverData.duration_sector_2 < this.fastestDurationSector2) {
                            this.fastestDurationSector2 = driverData.duration_sector_2;
                        }

                        if (!this.fastestDurationSector3 || driverData.duration_sector_3 < this.fastestDurationSector3) {
                            this.fastestDurationSector3 = driverData.duration_sector_3;
                        }

                        if (!driverData.driver_fastest_lap || driverData.lap_duration < driverData.driver_fastest_lap) {
                            driverData.driver_fastest_lap = driverData.lap_duration;
                        }

                        if (!driverData.fastest_driver_duration_sector1 || driverData.duration_sector_1 < driverData.fastest_driver_duration_sector1) {
                            driverData.fastest_driver_duration_sector1 = driverData.duration_sector_1;
                        }

                        if (!driverData.fastest_driver_duration_sector2 || driverData.duration_sector_2 < driverData.fastest_driver_duration_sector2) {
                            driverData.fastest_driver_duration_sector2 = driverData.duration_sector_2;
                        }

                        if (!driverData.fastest_driver_duration_sector3 || driverData.duration_sector_3 < driverData.fastest_driver_duration_sector3) {
                            driverData.fastest_driver_duration_sector3 = driverData.duration_sector_3;
                        }
                    }
                });
        } catch (e) {
            console.log(`ERROR WHEN FETCHIN: ${e}`);
        }
    }

    async fetchFlagImage(countryCode) {
        // Add to dictionary as a placeholder.
        this.flagImages[countryCode] = null;

        let request = `https://flagcdn.com/h60/${mapToTwoLetterCountryCode(countryCode).toLowerCase()}.png`;
        console.log(`Fetching flag image: ${request}`);
        this.flagImages[countryCode] = loadImage(request);
    }
}