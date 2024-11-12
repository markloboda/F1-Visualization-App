function isMouseInsideRect(x, y, width, height) {
    return mouseX > x && mouseX < x + width && mouseY > y && mouseY < y + height;
}

function calculateScreenSpaceCoord(coord, bbox, coordScale) {
    return [(coord[0] - bbox[0]) * coordScale, (coord[1] - bbox[1]) * coordScale]
}

function moveToScreenCenter(screenPosition, screenSize, shapeScreenSize) {
    return [screenPosition[0] + screenSize[0] / 2 - shapeScreenSize[0] / 2, (screenSize[1] - screenPosition[1]) - screenSize[1] / 2 + shapeScreenSize[1] / 2];
}

function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
}

function mapValue(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function mapPosition(value, inBbox, outBbox) {
    return [
        mapValue(value[0], inBbox[0], inBbox[2], outBbox[0], outBbox[2]),
        mapValue(value[1], inBbox[1], inBbox[3], outBbox[1], outBbox[3])
    ];
}

function getTyreCompoundColor(compound) {
    if (compound[0] == 'H') {
        return [181, 183, 185];
    } else if (compound[0] == 'M') {
        return [190, 185, 57];
    } else if (compound[0] == 'S') {
        return [157, 51, 65];
    } else if (compound[0] == 'I') {
        return [50, 175, 42];
    } else if (compound[0] == 'W') {
        return [61, 141, 39];
    } else {
        return [255];
    }
}

function calculateMaxTextDimensions(text, maxWidth, font, fontHeight) {
    textFont(font)
    textSize(fontHeight);

    let words = text.split(" ");
    let lineCount = 1;
    let currentLine = "";
    let maxRowWidth = 0;

    for (let word of words) {
        let testLine = currentLine + word + " ";
        let testLineWidth = textWidth(testLine);

        if (testLineWidth > maxWidth && currentLine !== "") {
            maxRowWidth = Math.max(maxRowWidth, textWidth(currentLine));
            lineCount++;
            currentLine = word + " ";
        } else {
            currentLine = testLine;
        }
    }

    // Update maxRowWidth for the last line
    maxRowWidth = Math.max(maxRowWidth, textWidth(currentLine));

    // Calculate total height
    let totalHeight = lineCount * fontHeight;

    return [maxRowWidth, totalHeight];
}

function mapToTwoLetterCountryCode(threLetterCountryCode) {
    return countryCodes[threLetterCountryCode] || null;
}

function f1TimeOutputTextFormat(timeData) {
    let result;

    let substrings = timeData.toString().split('.');
    if (substrings.length >= 2) {
        let intervalNumString = `${substrings[0]}.${substrings[1].padEnd(3, '0')}`;
        result = `${intervalNumString.toString().substring(0, 6)}`;
    } else {
        result = `${timeData}`
    }

    return result;
}

function getTimingColor(time, fastestDriverTime, fastestTime) {
    if (time == fastestTime) {
        return [240, 4, 241];
    }
    if (time == fastestDriverTime) {
        return [11, 217, 12]
    }

    return [255, 255, 255];
}


const countryCodes = {
    "AFG": "AF",
    "ALB": "AL",
    "DZA": "DZ",
    "ASM": "AS",
    "AND": "AD",
    "AGO": "AO",
    "AIA": "AI",
    "ATA": "AQ",
    "ATG": "AG",
    "ARG": "AR",
    "ARM": "AM",
    "ABW": "AW",
    "AUS": "AU",
    "AUT": "AT",
    "AZE": "AZ",
    "BHS": "BS",
    "BHR": "BH",
    "BGD": "BD",
    "BRB": "BB",
    "BLR": "BY",
    "BEL": "BE",
    "BLZ": "BZ",
    "BEN": "BJ",
    "BMU": "BM",
    "BTN": "BT",
    "BOL": "BO",
    "BES": "BQ",
    "BIH": "BA",
    "BWA": "BW",
    "BVT": "BV",
    "BRA": "BR",
    "IOT": "IO",
    "BRN": "BN",
    "BGR": "BG",
    "BFA": "BF",
    "BDI": "BI",
    "CPV": "CV",
    "KHM": "KH",
    "CMR": "CM",
    "CAN": "CA",
    "CYM": "KY",
    "CAF": "CF",
    "TCD": "TD",
    "CHL": "CL",
    "CHN": "CN",
    "CXR": "CX",
    "CCK": "CC",
    "COL": "CO",
    "COM": "KM",
    "COD": "CD",
    "COG": "CG",
    "COK": "CK",
    "CRI": "CR",
    "HRV": "HR",
    "CUB": "CU",
    "CUW": "CW",
    "CYP": "CY",
    "CZE": "CZ",
    "CIV": "CI",
    "DNK": "DK",
    "DJI": "DJ",
    "DMA": "DM",
    "DOM": "DO",
    "ECU": "EC",
    "EGY": "EG",
    "SLV": "SV",
    "GNQ": "GQ",
    "ERI": "ER",
    "EST": "EE",
    "SWZ": "SZ",
    "ETH": "ET",
    "FLK": "FK",
    "FRO": "FO",
    "FJI": "FJ",
    "FIN": "FI",
    "FRA": "FR",
    "GUF": "GF",
    "PYF": "PF",
    "ATF": "TF",
    "GAB": "GA",
    "GMB": "GM",
    "GEO": "GE",
    "DEU": "DE",
    "GHA": "GH",
    "GIB": "GI",
    "GRC": "GR",
    "GRL": "GL",
    "GRD": "GD",
    "GLP": "GP",
    "GUM": "GU",
    "GTM": "GT",
    "GGY": "GG",
    "GIN": "GN",
    "GNB": "GW",
    "GUY": "GY",
    "HTI": "HT",
    "HMD": "HM",
    "VAT": "VA",
    "HND": "HN",
    "HKG": "HK",
    "HUN": "HU",
    "ISL": "IS",
    "IND": "IN",
    "IDN": "ID",
    "IRN": "IR",
    "IRQ": "IQ",
    "IRL": "IE",
    "IMN": "IM",
    "ISR": "IL",
    "ITA": "IT",
    "JAM": "JM",
    "JPN": "JP",
    "JEY": "JE",
    "JOR": "JO",
    "KAZ": "KZ",
    "KEN": "KE",
    "KIR": "KI",
    "PRK": "KP",
    "KOR": "KR",
    "KWT": "KW",
    "KGZ": "KG",
    "LAO": "LA",
    "LVA": "LV",
    "LBN": "LB",
    "LSO": "LS",
    "LBR": "LR",
    "LBY": "LY",
    "LIE": "LI",
    "LTU": "LT",
    "LUX": "LU",
    "MAC": "MO",
    "MDG": "MG",
    "MWI": "MW",
    "MYS": "MY",
    "MDV": "MV",
    "MLI": "ML",
    "MLT": "MT",
    "MHL": "MH",
    "MTQ": "MQ",
    "MRT": "MR",
    "MUS": "MU",
    "MYT": "YT",
    "MEX": "MX",
    "FSM": "FM",
    "MDA": "MD",
    "MCO": "MC",
    "MNG": "MN",
    "MNE": "ME",
    "MSR": "MS",
    "MAR": "MA",
    "MOZ": "MZ",
    "MMR": "MM",
    "NAM": "NA",
    "NRU": "NR",
    "NPL": "NP",
    "NLD": "NL",
    "NCL": "NC",
    "NZL": "NZ",
    "NIC": "NI",
    "NER": "NE",
    "NGA": "NG",
    "NIU": "NU",
    "NFK": "NF",
    "MNP": "MP",
    "NOR": "NO",
    "OMN": "OM",
    "PAK": "PK",
    "PLW": "PW",
    "PSE": "PS",
    "PAN": "PA",
    "PNG": "PG",
    "PRY": "PY",
    "PER": "PE",
    "PHL": "PH",
    "PCN": "PN",
    "POL": "PL",
    "PRT": "PT",
    "PRI": "PR",
    "QAT": "QA",
    "MKD": "MK",
    "ROU": "RO",
    "RUS": "RU",
    "RWA": "RW",
    "REU": "RE",
    "BLM": "BL",
    "SHN": "SH",
    "KNA": "KN",
    "LCA": "LC",
    "MAF": "MF",
    "SPM": "PM",
    "VCT": "VC",
    "WSM": "WS",
    "SMR": "SM",
    "STP": "ST",
    "SAU": "SA",
    "SEN": "SN",
    "SRB": "RS",
    "SYC": "SC",
    "SLE": "SL",
    "SGP": "SG",
    "SXM": "SX",
    "SVK": "SK",
    "SVN": "SI",
    "SLB": "SB",
    "SOM": "SO",
    "ZAF": "ZA",
    "SGS": "GS",
    "SSD": "SS",
    "ESP": "ES",
    "LKA": "LK",
    "SDN": "SD",
    "SUR": "SR",
    "SJM": "SJ",
    "SWE": "SE",
    "CHE": "CH",
    "SYR": "SY",
    "TWN": "TW",
    "TJK": "TJ",
    "TZA": "TZ",
    "THA": "TH",
    "TLS": "TL",
    "TGO": "TG",
    "TKL": "TK",
    "TON": "TO",
    "TTO": "TT",
    "TUN": "TN",
    "TUR": "TR",
    "TKM": "TM",
    "TCA": "TC",
    "TUV": "TV",
    "UGA": "UG",
    "UKR": "UA",
    "ARE": "AE",
    "GBR": "GB",
    "UMI": "UM",
    "USA": "US",
    "URY": "UY",
    "UZB": "UZ",
    "VUT": "VU",
    "VEN": "VE",
    "VNM": "VN",
    "VGB": "VG",
    "VIR": "VI",
    "WLF": "WF",
    "ESH": "EH",
    "YEM": "YE",
    "ZMB": "ZM",
    "ZWE": "ZW",
    "ALA": "AX",
}
