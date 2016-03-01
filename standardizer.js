/**
 * Main handler
 */
document.getElementById("trigger").onclick = handler;

function handler () {
    var svg = document.getElementById("text").value
    cleanSvg(svg);
}

function cleanSvg (svg) {
    hideError();
    var svgArray = parse(svg);

    svgArray = convertToRelative(svgArray);
    if (svgArray !== -1) {
        if (svgArray[svgArray.length - 1].toLowerCase() !== "z") {
            svgArray.push("z");
        }
        svg = svgArray.join("");
    }
    print(svg);
}

/**
 * Splits the svg string into an array of character codes & coordinates
 */
function parse (svg) {
    var newsvg = svg.split(/([a-z|A-Z](?=[\s*\-?\s*\d*|\w*|$]))/g).filter(function(el) {return el.trim()});
    // The above regex can't capture the last z|Z in the svg, so I'm doing it by hand
    var lastSvg = newsvg[newsvg.length - 1].replace(/[z|Z]/g, "").trim();
    if (lastSvg.length > 1) {
        newsvg[newsvg.length - 1] = lastSvg;
        newsvg.push("z");
    }
    return newsvg;
}

/**
 * Splits the svg string into an array of character codes & coordinates
 */
function parseCoords (coords) {
    coords = coords.trim();
    return coords.split(/(?=[\s*|\,|\-])/)
        .filter(function (el) {return el.trim()})
        .filter(function (el) {return el.trim() !== ","})
        .map(function (el) {return el.trim().replace(/\,/g, "")})
        .map(function (el) {return parseFloat(el)});
}

/**
 * Takes an array of character codes & coordinates and converts absolute commands
 * to relative ones.
 */
function convertToRelative (svgArray) {
    var x = 0;
    var y = 0;
    var dx, dy, coords, i, j, l;
    var parseCommand = true;
    var commandType;
    var curvex, curvey;

    for (i = 0; i < svgArray.length; i++) {
        // tests for even/odd to check if a command won't work due to the z|Z control character
        if (parseCommand) {
            if (svgArray[i] === "z" || svgArray[i] === "Z") {
                svgArray[i] = svgArray[i].toLowerCase();
                continue;
            }

            if (svgArray[i] === "M" || svgArray[i] === "L") {
                commandType = "absolute";
            } else if (svgArray[i] === "m" || svgArray[i] === "l") {
                commandType = "relative";
            } else if (svgArray[i] === "V") {
                commandType = "vertical";
            } else if (svgArray[i] === "v") {
                commandType = "vertical-relative";
            } else if (svgArray[i] === "H") {
                commandType = "horizontal";
            } else if (svgArray[i] === "h") {
                commandType = "horizontal-relative";
            } else if (svgArray[i] === "C" || svgArray[i] === "S" || svgArray[i] === "Q" || svgArray[i] === "T") {
                commandType = "curve";
            } else if (svgArray[i] === "c" || svgArray[i] === "s" || svgArray[i] === "q" || svgArray[i] === "t") {
                commandType = "curve-relative";
            } else { //assumes other control character
                i++;
                continue;
            }

            parseCommand = false;
            if (i !== 0) {
                svgArray[i] = svgArray[i].toLowerCase();
            }
        } else {
            parseCommand = true;
            try {
                coords = parseCoords(svgArray[i]);
            } catch (e) {
                printError("Error: Unable to parse the coordinates: '" + svgArray[i] + "'");
                return -1;
            }

            l = coords.length;
            if (commandType === "relative") {
                for (j = 0; j < l; j = j + 2) {
                    x += coords[j];
                    y += coords[j + 1];
                }
            } else if (commandType === "absolute") {
                for (j = 0; j < l; j = j + 2) {
                    dx = coords[j] - x;
                    dy = coords[j + 1] - y;
                    x = coords[j];
                    y = coords[j + 1];
                    coords[j] = dx.toFixed(3)
                    coords[j + 1] = dy.toFixed(3)
                }
                svgArray[i] = coords.join(",")
            } else if (commandType === "vertical") {
                for (j = 0; j < l; j++) {
                    dy = coords[j] - y;
                    y = coords[j];
                    coords[j] = dy.toFixed(3);
                }
                svgArray[i] = coords.join(",")
            } else if (commandType === "vertical-relative") {
                for (j = 0; j < l; j++) {
                    y += coords[j];
                }
            } else if (commandType === "horizontal") {
                for (j = 0; j < l; j++) {
                    dx = coords[j] - x;
                    x = coords[j];
                    coords[j] = dx.toFixed(3);
                }
                svgArray[i] = coords.join(",")
            } else if (commandType === "horizontal-relative") {
                for (j = 0; j < l; j++) {
                    x += coords[j];
                }
            } else if (commandType === "curve") {
                curvex = coords[l - 2];
                curvey = coords[l - 1];

                for (j = 0; j < l; j = j + 2) {
                    dx = coords[j] - x;
                    dy = coords[j + 1] - y;
                    coords[j] = dx.toFixed(3)
                    coords[j + 1] = dy.toFixed(3)
                }
                svgArray[i] = coords.join(",")
                x = curvex;
                y = curvey;
            } else if (commandType === "curve-relative") {
                x += coords[l - 2];
                y += coords[l - 1];
            }
        }
    }

    return svgArray;
}

function print (string) {
    document.getElementById("svg").textContent = string;
}

function printError (string) {
    document.getElementById("error").textContent = string;
}

function hideError () {
    document.getElementById("error").textContent = "";
}

