const FONT_SIZE = 22;
const F1_BOLD_FONT_PATH = "./resources/font/Formula1-Bold_web_0.ttf"
const F1_REGULAR_FONT_PATH = "./resources/font/Formula1-Regular_web_0.ttf"
const F1_WIDE_FONT_PATH = "./resources/font/Formula1-Wide_web_0.ttf"
const BACKGROUND_COLOR = [21, 21, 30];

const MESSAGE_DISPLAY_TIME = 5;

const TOP_PADDING = 100;
const BOTTOM_PADDING = 100;
const LEFT_PADDING = 50;
const RIGHT_PADDING = 50;

const LEFT_CANVAS_TEXT_LEFT_PADDING = 15;

class NormalVisualizer {
    constructor() { }

    setup() {
        this.raceControlMessagesTimer = 0;

        this.f1BoldFont = loadFont(F1_BOLD_FONT_PATH);
        this.f1RegularFont = loadFont(F1_REGULAR_FONT_PATH);
        this.f1WideFont = loadFont(F1_WIDE_FONT_PATH);

        this.activeDriverNumber = null;
    }

    update(dt) {
        this.raceControlMessagesTimer = max(0, this.raceControlMessagesTimer - dt);
    }

    draw() {
        this.drawCanvas1();
        this.drawCanvas2();
    }

    drawCanvas1() {
        textFont(this.f1BoldFont);

        background(BACKGROUND_COLOR);

        // Draw track name.
        let meetingData = app.dataManager.getRawMeetingData();
        let headerHeght = 0;
        let imageWidth;
        if (meetingData) {
            if (this.f1WideFont) {
                textFont(this.f1WideFont);
            }

            let img = app.dataManager.flagImages[meetingData.country_code];
            let textSizeValue = img.height / 2 - 3;
            let textPosition = [LEFT_PADDING + img.width + LEFT_CANVAS_TEXT_LEFT_PADDING, (TOP_PADDING - img.height) / 2];
            headerHeght = textPosition[1] + textSizeValue;
            imageWidth = img.width;

            if (app.dataManager.flagImages && app.dataManager.flagImages[meetingData.country_code]) {
                image(img, LEFT_PADDING, textPosition[1]);
            }

            fill(255, 255, 255);
            textSize(textSizeValue);
            textAlign(LEFT, TOP);

            let trackName = `${meetingData.country_name}\n${meetingData.meeting_name}`;
            text(trackName, ...textPosition);

            let newLeftCanvasWidth = LEFT_PADDING + img.width + textWidth(meetingData.meeting_name) + LEFT_CANVAS_TEXT_LEFT_PADDING;
            if (newLeftCanvasWidth != app.leftCanvasWidth) {
                app.leftCanvasWidth = newLeftCanvasWidth;
                app.windowResized()
            }
        }

        let positionedDriverNumbers = app.dataManager.positionedDriverNumbers;

        if (positionedDriverNumbers.length == 0) {
            return;
        }

        let listMinHeight = FONT_SIZE * positionedDriverNumbers.length;
        let listMaxHeight = (FONT_SIZE + 10) * positionedDriverNumbers.length;

        let listHeight = clamp(height - TOP_PADDING - BOTTOM_PADDING, listMinHeight, listMaxHeight);

        let listStartPosition = [LEFT_PADDING + imageWidth, (height - listHeight) / 2];

        textSize(FONT_SIZE);
        textFont(this.f1BoldFont);
        textAlign(LEFT, TOP);

        let driversData = app.dataManager.getDriversData();
        let stepY = max((listHeight) / positionedDriverNumbers.length, FONT_SIZE);

        let driversDataKeys = Object.keys(driversData);
        if (driversDataKeys.length == 0) {
            return;
        }

        let cursorPosition = [...listStartPosition];

        let maxWidth = 0;
        let digitMaxWidth = max(textWidth('0'), textWidth('1'), textWidth('2'), textWidth('3'), textWidth('4'), textWidth('5'), textWidth('6'), textWidth('7'), textWidth('8'), textWidth('9'));

        // Position.
        textAlign(RIGHT, TOP);
        for (let i = 0; i < positionedDriverNumbers.length; i++) {
            fill(255);

            let driverData = app.dataManager.dataByDriverNumber[app.dataManager.positionedDriverNumbers[i]];

            let positionString = `${(i + 1).toString().padStart(2, ' ')}.`;

            // Workaround for number 7 being offset.
            let numOfChar7 = (positionString.match(7) || []).length;

            if (this.activeDriverNumber == driverData.driver_number) {
                fill(color(`#${driverData.team_colour}`));
            }

            text(positionString, cursorPosition[0] - numOfChar7 * 3.5, cursorPosition[1]);

            // Fastest lap.
            if (app.dataManager.fastestLapLogo && driverData.driver_number == app.dataManager.fastestLapDriverNumber) {
                image(app.dataManager.fastestLapLogo, cursorPosition[0] - 2 * digitMaxWidth - FONT_SIZE - LEFT_CANVAS_TEXT_LEFT_PADDING, cursorPosition[1], FONT_SIZE, FONT_SIZE);
            }

            cursorPosition[1] += stepY;
        }

        // Team colour.
        cursorPosition = [cursorPosition[0] + LEFT_CANVAS_TEXT_LEFT_PADDING, listStartPosition[1]];
        let teamColourWidth = 5;
        maxWidth = 0;
        for (let i = 0; i < positionedDriverNumbers.length; i++) {
            let driverData = app.dataManager.dataByDriverNumber[app.dataManager.positionedDriverNumbers[i]];

            let teamColuor = color(`#${driverData.team_colour}`);
            fill(teamColuor);
            rect(cursorPosition[0], cursorPosition[1] + 3, teamColourWidth, FONT_SIZE - 6);

            cursorPosition[1] += stepY;
        }
        maxWidth = teamColourWidth;

        // Driver acronym.
        cursorPosition = [cursorPosition[0] + maxWidth + LEFT_CANVAS_TEXT_LEFT_PADDING, listStartPosition[1]];
        textAlign(LEFT, TOP);
        fill(255);
        maxWidth = 0;
        for (let i = 0; i < positionedDriverNumbers.length; i++) {
            let driverNumber = positionedDriverNumbers[i];
            let driverData = driversData[driverNumber];

            let driverAcronymString = driverData.name_acronym;
            let driverAcronymStringWidth = textWidth(driverAcronymString);
            if (driverAcronymStringWidth > maxWidth) {
                maxWidth = driverAcronymStringWidth;
            }

            // Button
            let isHovering = false;
            if (isMouseInsideRect(cursorPosition[0] - 75, cursorPosition[1], driverAcronymStringWidth + 50 * 2, FONT_SIZE)) {
                fill(150);
                if (app.leftMouseClicked) {
                    this.activeDriverNumber = driverData.driver_number;
                }
            } else {
                fill(255);
            }

            if (this.activeDriverNumber == driverData.driver_number) {
                fill(color(`#${driverData.team_colour}`));
            }

            text(driverAcronymString, cursorPosition[0], cursorPosition[1]);

            cursorPosition[1] += stepY;
        }

        // Tyre compound.
        cursorPosition = [cursorPosition[0] + maxWidth + LEFT_CANVAS_TEXT_LEFT_PADDING, listStartPosition[1]];
        textAlign(CENTER, TOP);
        maxWidth = 0;

        // Find max width between
        maxWidth = max(textWidth('S'), textWidth('M'), textWidth('H'), textWidth('I'), textWidth('W'));
        for (let i = 0; i < positionedDriverNumbers.length; i++) {
            let driverNumber = positionedDriverNumbers[i];
            let driverData = driversData[driverNumber];

            if (!driverData.compound) {
                continue;
            }

            fill(...getTyreCompoundColor(driverData.compound[0]));
            let tyreCompoundString = driverData.compound[0];
            text(tyreCompoundString, cursorPosition[0] + maxWidth / 2, cursorPosition[1]);

            cursorPosition[1] += stepY;
        }

        // Tyre age.
        cursorPosition = [cursorPosition[0] + maxWidth + LEFT_CANVAS_TEXT_LEFT_PADDING, listStartPosition[1]];
        textAlign(CENTER, TOP);
        fill(255);
        maxWidth = 0;

        // Find max width between
        maxWidth = 2 * digitMaxWidth;
        for (let i = 0; i < positionedDriverNumbers.length; i++) {
            let driverNumber = positionedDriverNumbers[i];
            let driverData = driversData[driverNumber];

            let tyreAge = app.dataManager.currentLap - driverData.lap_start + driverData.tyre_age_at_start;
            if (!driverData.compound || isNaN(tyreAge)) {
                continue;
            }

            let tyreAgeString = `${tyreAge}`.padStart(2);
            fill(...getTyreCompoundColor(driverData.compound[0]));
            text(tyreAgeString, cursorPosition[0] + maxWidth / 2, cursorPosition[1]);

            cursorPosition[1] += stepY;
        }

        // Interval.
        cursorPosition = [cursorPosition[0] + maxWidth + LEFT_CANVAS_TEXT_LEFT_PADDING, listStartPosition[1]];
        textAlign(RIGHT, TOP);
        maxWidth = 6 * digitMaxWidth + textWidth(".");
        for (let i = 0; i < positionedDriverNumbers.length; i++) {
            fill(255);

            let driverNumber = positionedDriverNumbers[i];
            let driverData = driversData[driverNumber];

            let intervalString = "";
            if (i == 0) {
                intervalString = "Interval";
            } else {
                if (driverData.interval) {
                    intervalString = `+${f1TimeOutputTextFormat(driverData.interval)}`;
                }
            }

            if (this.activeDriverNumber == driverData.driver_number) {
                fill(color(`#${driverData.team_colour}`));
            }

            text(intervalString, cursorPosition[0] + maxWidth, cursorPosition[1]);

            cursorPosition[1] += stepY;
        }

        // Leader
        cursorPosition = [cursorPosition[0] + maxWidth + LEFT_CANVAS_TEXT_LEFT_PADDING, listStartPosition[1]];
        textAlign(RIGHT, TOP);
        maxWidth = 6 * digitMaxWidth + textWidth(".");
        for (let i = 0; i < positionedDriverNumbers.length; i++) {
            fill(255);

            let driverNumber = positionedDriverNumbers[i];
            let driverData = driversData[driverNumber];

            let leaderString = "";
            if (i == 0) {
                leaderString = "Leader";
            } else {
                if (driverData.gap_to_leader) {
                    leaderString = `+${f1TimeOutputTextFormat(driverData.gap_to_leader)}`;
                }
            }

            if (this.activeDriverNumber == driverData.driver_number) {
                fill(color(`#${driverData.team_colour}`));
            }

            text(leaderString, cursorPosition[0] + maxWidth, cursorPosition[1]);

            cursorPosition[1] += stepY;
        }
    }

    drawCanvas2() {
        let canvas = app.canvas2;
        canvas.background(BACKGROUND_COLOR);

        if (this.f1BoldFont) {
            canvas.textFont(this.f1BoldFont);
        }

        let screenTrackPositionY = 0;
        if (app.dataManager.trackData) {
            let trackData = app.dataManager.trackData;

            let screenTrackMaxSize = max(200, min(canvas.width - LEFT_PADDING - RIGHT_PADDING, canvas.height - TOP_PADDING - BOTTOM_PADDING) * 0.8);
            let trackSize = [trackData.bboxTrack[2] - trackData.bboxTrack[0], trackData.bboxTrack[3] - trackData.bboxTrack[1]];
            let screenTrackSize;
            if (trackSize[0] > trackSize[1]) {
                screenTrackSize = [screenTrackMaxSize, screenTrackMaxSize * trackSize[1] / trackSize[0]];
            } else {
                screenTrackSize = [screenTrackMaxSize * trackSize[0] / trackSize[1], screenTrackMaxSize];
            }

            let screenTrackPosition = [canvas.width / 2, canvas.height / 2];
            let screenTrackBbox = [screenTrackPosition[0] - screenTrackSize[0] / 2, screenTrackPosition[1] - screenTrackSize[1] / 2, screenTrackPosition[0] + screenTrackSize[0] / 2, screenTrackPosition[1] + screenTrackSize[1] / 2];
            screenTrackPositionY = screenTrackBbox[1]

            // Draw track
            canvas.noFill();
            canvas.stroke(68, 68, 75);
            canvas.strokeWeight(15);
            let length = min(trackData.x.length, trackData.y.length);
            canvas.beginShape();
            for (let i = 0; i < length; i++) {
                let vertexPos = [trackData.x[i], trackData.y[i]]

                // Map values to screen coordinates
                vertexPos = mapPosition(vertexPos, trackData.bboxTrack, screenTrackBbox);

                canvas.vertex(...vertexPos);
            }
            canvas.endShape(CLOSE);

            // Draw drivers
            canvas.strokeWeight(0);
            canvas.textAlign(LEFT, TOP);
            for (let i = app.dataManager.positionedDriverNumbers.length - 1; i >= 0; i--) {
                let driverData = app.dataManager.dataByDriverNumber[app.dataManager.positionedDriverNumbers[i]];

                if (driverData.driver_number == this.activeDriverNumber) {
                    continue;
                }

                this.drawDriverDot(canvas, driverData, trackData, screenTrackBbox);
            }

            if (this.activeDriverNumber) {
                let driverData = app.dataManager.dataByDriverNumber[this.activeDriverNumber];
                this.drawDriverDot(canvas, driverData, trackData, screenTrackBbox)
            }
        }

        // Handle messages
        {
            if (this.raceControlMessagesTimer <= 0) {
                this.currentMessage = app.dataManager.raceControlData.messageStack.shift();
                this.raceControlMessagesTimer = MESSAGE_DISPLAY_TIME;
            }

            let maxWidth = 400;
            let padding = 15;

            let fontSize = 20;
            let messegesFont = this.f1RegularFont;
            canvas.textSize(fontSize);
            if (messegesFont) {
                canvas.textFont(messegesFont);
            }

            if (this.currentMessage) {
                let message = `Race Control: ${this.currentMessage.message}`;

                let textDimensions = calculateMaxTextDimensions(message, maxWidth, messegesFont, fontSize);

                let boxPosition = [canvas.width - textDimensions[0] - padding, canvas.height - BOTTOM_PADDING - textDimensions[1] - padding / 2];

                // Draw box.
                canvas.fill(255, 255, 255, 10);
                canvas.stroke(0);
                canvas.strokeWeight(1);
                canvas.rect(boxPosition[0], boxPosition[1], textDimensions[0] + 2 * padding, textDimensions[1] + 2 * padding);

                canvas.fill(255);
                canvas.textWrap(WORD);
                canvas.text(`${message}`, canvas.width - textDimensions[0], canvas.height - BOTTOM_PADDING - textDimensions[1], textDimensions[0] + 2 * padding);
            }
        }

        let timeTextPositionX;
        if (app.currentTime) {
            canvas.fill(255);
            canvas.textSize(FONT_SIZE);

            let sessionData = app.dataManager.getRawSessionData();
            if (sessionData) {
                const [hours, minutes, seconds] = sessionData.gmt_offset.substring(1).split(':').map(Number);
                const offsetMillis = (sessionData.gmt_offset[0] === '-' ? -1 : 1) * (((hours - 1) * 60 + minutes) * 60 + seconds) * 1000;

                let trackTime = new Date(app.currentTime.getTime() + offsetMillis);

                let timeString = trackTime.toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                timeTextPositionX = max(LEFT_PADDING, canvas.width - canvas.textWidth(timeString) - RIGHT_PADDING);
                canvas.text(`Track Time\n${timeString}`, timeTextPositionX, (TOP_PADDING - FONT_SIZE) / 2);
            }
        }

        // Draw active driver data.
        let driverData = app.dataManager.dataByDriverNumber[this.activeDriverNumber];
        if (this.activeDriverNumber && driverData) {
            let padding = 30;
            let fontSize = 20;
            let textPadding = 10;

            canvas.textSize(fontSize);

            this.activeDriverRectHeight = 8 * fontSize + padding * 2;
            let activeDriverRect = [padding, 0, min(timeTextPositionX - padding * 2, 800), this.activeDriverRectHeight];
            if (this.cachedBboxRight) {

                activeDriverRect[2] = min(this.cachedBboxRight, activeDriverRect[2]);
            }

            canvas.fill(255, 255, 255, 5);
            canvas.stroke(100);
            canvas.strokeWeight(2);
            canvas.rect(activeDriverRect[0] - 3, activeDriverRect[1] - 3, activeDriverRect[2] + 3, activeDriverRect[3] + 3, 0, 0, 10, 10);

            canvas.stroke(0);

            let cursorPosition = [activeDriverRect[0], activeDriverRect[1] + textPadding];

            // Driver image.
            let imgSize = [93, 93];
            let imgPos = [...cursorPosition];
            {
                let bounds = [cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], , imgSize[1]];

                if (bounds[2] - imgSize[0] > 0) {
                    if (!driverData.loadedImage && driverData.headshot_url) {
                        loadImage(driverData.headshot_url, (img) => driverData.loadedImage = img);
                    } else {
                        driverData.isLoadingImage = false;
                    }

                    if (driverData.loadedImage) {
                        canvas.image(driverData.loadedImage, cursorPosition[0], cursorPosition[1]);
                    } else {
                        canvas.fill(50);
                        canvas.rect(cursorPosition[0], cursorPosition[1], imgSize[0], imgSize[1]);
                        canvas.fill(255);
                        canvas.text("Missing image", cursorPosition[0], cursorPosition[1], imgSize[0], imgSize[1])
                    }
                }
            }

            cursorPosition[0] += imgSize[0] + textPadding;

            // Driver name.
            {
                let bounds = [cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], 2 * fontSize];
                canvas.textSize(2 * fontSize);
                if (bounds[2] - canvas.textWidth(driverData.full_name.split(" ")[0]) > 0) {
                    canvas.fill(255);
                    canvas.text(driverData.full_name, cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], 2 * fontSize);
                }
            }
            cursorPosition[1] = imgPos[1] + imgSize[1] - 1.5 * fontSize;

            // Team name.
            {
                let bounds = [cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], 1.5 * fontSize];
                canvas.textSize(1.5 * fontSize);
                if (bounds[2] - canvas.textWidth(driverData.team_colour.split(" ")[0]) > 0) {
                    canvas.fill(color(`#${driverData.team_colour}`));
                    canvas.text(driverData.team_name, cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], 1.5 * fontSize);
                }
            }

            cursorPosition = [imgPos[0] + textPadding, cursorPosition[1] + 1.5 * fontSize + 2 * textPadding];
            let cacheCursorPositionY = cursorPosition[1];
            canvas.textSize(fontSize);

            // First column.
            let firstColumnWidth = canvas.textWidth("Fastest");
            cursorPosition[0] += firstColumnWidth;
            canvas.textAlign(RIGHT, TOP);
            {
                let bounds = [cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], fontSize * 2];
                if (bounds[2] - firstColumnWidth > 0) {
                    canvas.fill(100);
                    canvas.text("", ...cursorPosition)
                    cursorPosition[1] += fontSize + textPadding;
                    canvas.fill(255);

                    canvas.text("Last", ...cursorPosition);
                    cursorPosition[1] += fontSize + textPadding;
                    canvas.text("Fastest", ...cursorPosition);
                }
            }

            cursorPosition = [cursorPosition[0] + textPadding, cacheCursorPositionY];

            canvas.textAlign(LEFT, TOP);
            // Lap time
            let lapTimeTextWidth = canvas.textWidth("Lap time");
            {
                let bounds = [cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], fontSize * 2];
                if (bounds[2] - lapTimeTextWidth > 0) {
                    canvas.fill(100);
                    canvas.text("Lap time", ...cursorPosition)
                    cursorPosition[1] += fontSize + textPadding;
                    canvas.fill(255);

                    if (driverData.lap_duration && driverData.driver_fastest_lap) {
                        canvas.fill(...getTimingColor(driverData.lap_duration, driverData.driver_fastest_lap, app.dataManager.fastestLap))
                        canvas.text(f1TimeOutputTextFormat(driverData.lap_duration), ...cursorPosition);
                        cursorPosition[1] += fontSize + textPadding;
                        canvas.fill(...getTimingColor(driverData.driver_fastest_lap, driverData.driver_fastest_lap, app.dataManager.fastestLap))
                        canvas.text(f1TimeOutputTextFormat(driverData.driver_fastest_lap), ...cursorPosition);
                    }
                }
            }

            cursorPosition = [cursorPosition[0] + lapTimeTextWidth + textPadding, cacheCursorPositionY];
            // Sector times.
            let sectorTextWidth = canvas.textWidth("Sector 1");
            {
                let bounds = [cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], fontSize * 2];

                if (bounds[2] - sectorTextWidth > 0) {
                    canvas.fill(100);
                    canvas.text("Sector 1", ...cursorPosition)
                    cursorPosition[1] += fontSize + textPadding;
                    canvas.fill(255);

                    if (driverData.duration_sector_1 && driverData.fastest_driver_duration_sector1) {
                        canvas.fill(...getTimingColor(driverData.duration_sector_1, driverData.fastest_driver_duration_sector1, app.dataManager.fastestDurationSector1))
                        canvas.text(f1TimeOutputTextFormat(driverData.duration_sector_1), ...cursorPosition);
                        cursorPosition[1] += fontSize + textPadding;
                        canvas.fill(...getTimingColor(driverData.fastest_driver_duration_sector1, driverData.fastest_driver_duration_sector1, app.dataManager.fastestDurationSector1))
                        canvas.text(f1TimeOutputTextFormat(driverData.fastest_driver_duration_sector1), ...cursorPosition);
                    }
                }
            }

            cursorPosition = [cursorPosition[0] + sectorTextWidth + textPadding, cacheCursorPositionY];
            {
                let bounds = [cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], fontSize * 2];
                if (bounds[2] - sectorTextWidth > 0) {
                    canvas.fill(100);
                    canvas.text("Sector 2", ...cursorPosition)
                    cursorPosition[1] += fontSize + textPadding;
                    canvas.fill(255);

                    if (driverData.duration_sector_2 && driverData.fastest_driver_duration_sector2) {
                        canvas.fill(...getTimingColor(driverData.duration_sector_2, driverData.fastest_driver_duration_sector2, app.dataManager.fastestDurationSector2))
                        canvas.text(f1TimeOutputTextFormat(driverData.duration_sector_2), ...cursorPosition);
                        cursorPosition[1] += fontSize + textPadding;
                        canvas.fill(...getTimingColor(driverData.fastest_driver_duration_sector2, driverData.fastest_driver_duration_sector2, app.dataManager.fastestDurationSector2))
                        canvas.text(f1TimeOutputTextFormat(driverData.fastest_driver_duration_sector2), ...cursorPosition);
                    }
                }
            }

            cursorPosition = [cursorPosition[0] + sectorTextWidth + textPadding, cacheCursorPositionY];
            {
                let bounds = [cursorPosition[0], cursorPosition[1], activeDriverRect[2] - cursorPosition[0], fontSize * 2];
                if (bounds[2] - sectorTextWidth > 0) {
                    canvas.fill(100);
                    canvas.text("Sector 3", ...cursorPosition)
                    cursorPosition[1] += fontSize + textPadding;
                    canvas.fill(255);

                    if (driverData.duration_sector_3 && driverData.fastest_driver_duration_sector3) {
                        canvas.fill(...getTimingColor(driverData.duration_sector_3, driverData.fastest_driver_duration_sector3, app.dataManager.fastestDurationSector3))
                        canvas.text(f1TimeOutputTextFormat(driverData.duration_sector_3), ...cursorPosition);
                        cursorPosition[1] += fontSize + textPadding;
                        canvas.fill(...getTimingColor(driverData.fastest_driver_duration_sector3, driverData.fastest_driver_duration_sector3, app.dataManager.fastestDurationSector3))
                        canvas.text(f1TimeOutputTextFormat(driverData.fastest_driver_duration_sector3), ...cursorPosition);
                    }
                }
            }

            cursorPosition = [cursorPosition[0] + sectorTextWidth + textPadding, cacheCursorPositionY];

            this.cachedBboxRight = max(cursorPosition[0] + 100);
        }
    }

    drawDriverDot(canvas, driverData, trackData, screenTrackBbox) {
        let driverPosition = [driverData.x, driverData.y];

        // Map values to screen coordinates.
        driverPosition = mapPosition(driverPosition, trackData.bboxTrack, screenTrackBbox);

        // Set color and draw.
        let teamColuor = color(`#${driverData.team_colour}`);
        canvas.fill(teamColuor);

        let circleRadius = 10;
        if (driverData.driver_number == this.activeDriverNumber) {
            circleRadius = 25;
        }

        canvas.circle(...driverPosition, circleRadius);

        let fontSize = 15;
        let nameOffset = [15, -fontSize / 2];
        let nameAcronym = driverData.name_acronym;

        canvas.textSize(fontSize);
        let textPosition = [driverPosition[0] + nameOffset[0], driverPosition[1] + nameOffset[1]];

        let rectPadding = 7;
        canvas.fill(15, 16, 20, 150);
        canvas.rect(textPosition[0] - rectPadding, textPosition[1] - rectPadding, canvas.textWidth(nameAcronym) + rectPadding * 2, fontSize + rectPadding * 2, 5);

        canvas.fill(teamColuor);
        canvas.text(nameAcronym, textPosition[0], textPosition[1]);
    }
}
