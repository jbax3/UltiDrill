// ## Variable Initialization
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const smoothingSlider = document.getElementById('smoothing');
const dashedCheckbox = document.getElementById('dashed');
const coneButton = document.getElementById('placeCone');
const discButton = document.getElementById('placeDisc');
const toggleSwitches = document.querySelectorAll('input[type="checkbox"]');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let strokeCounter = 0;
let currentStroke = [];
let placeConeMode = false;
let placeDiscMode = false;
let canvasHistory = [];
let historyIndex = -1;

// Save the current state of the canvas
function saveCanvasState() {
    canvasHistory.push(canvas.toDataURL());
    historyIndex++;
}

// Restore the canvas to a previous state
function undoCanvas() {
    if (historyIndex <= 0) return;  // Nothing to undo
    historyIndex--;
    let previousState = new Image();
    previousState.src = canvasHistory[historyIndex];
    previousState.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(previousState, 0, 0);
    };
    canvasHistory.pop();  // Remove the last state
}

// Modify the endDrawing function to save canvas state
function endDrawing() {
    isDrawing = false;
    if (placeConeMode || placeDiscMode) return;
    smoothAndApplyGradientToStroke(currentStroke);
    currentStroke = [];
    saveCanvasState();  // Save state after drawing is done
}

// Event listener for the Undo button
document.getElementById('undoButton').addEventListener('click', undoCanvas);


// ## Event Listener Set up
// Drawing listeners
canvas.addEventListener('mousedown', (e) => {
    if (placeConeMode) {
        drawCone(e.offsetX, e.offsetY);
        return;
    }

    if (placeDiscMode) {
        drawDisc(e.offsetX, e.offsetY);
        return;
    }

    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    strokeCounter++;
    currentStroke = [{ x: e.offsetX, y: e.offsetY }];
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseout', endDrawing);

coneButton.addEventListener('click', toggleConeMode);
discButton.addEventListener('click', toggleDiscMode);

function toggleConeMode() {
    placeConeMode = !placeConeMode;
    if (placeConeMode) {
        placeDiscMode = false;  // Ensure only one mode is active
    }
}

function toggleDiscMode() {
    placeDiscMode = !placeDiscMode;
    if (placeDiscMode) {
        placeConeMode = false;  // Ensure only one mode is active
    }
}

// Ensure only one toggle switch can be activated at a time.
toggleSwitches.forEach(switchEl => {
    switchEl.addEventListener('change', function handleToggleChange() {
        // If the current switch is activated
        if (switchEl.checked) {
            // Deactivate all other switches
            toggleSwitches.forEach(el => {
                if (el !== switchEl) {
                    el.checked = false;
                }
            });
        }
    });
});


function drawCone(x, y) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x - 10, y + 15);
    ctx.lineTo(x + 10, y + 15);
    ctx.closePath();
    ctx.fill();

    // Switch back to drawing mode after placing a cone
    placeConeMode = false;
    placeDiscMode = false;
    document.getElementById('placeCone').checked = false;  // Update the toggle switch's state on the UI

}

function drawDisc(x, y) {
    ctx.fillStyle = 'lightblue';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fill();

    // Switch back to drawing mode after placing a disc
    placeConeMode = false;
    placeDiscMode = false;
    document.getElementById('placeDisc').checked = false;  // Update the toggle switch's state on the UI

}

function endDrawing() {
    isDrawing = false;
    if (placeConeMode || placeDiscMode) return;
    smoothAndApplyGradientToStroke(currentStroke);
    currentStroke = [];
}

function gradientColormap(t) {
    let r, g, b;

    if (t < 0.25) {
        // Green to Yellow
        r = 255 * t * 4;
        g = 255;
        b = 0;
    } else if (t < 0.5) {
        // Yellow to Orange
        r = 255;
        g = 255 - (255 * (t - 0.25) * 4);
        b = 0;
    } else if (t < 0.75) {
        // Orange to Red
        r = 255;
        g = 0;
        b = (255 * (t - 0.5) * 4);
    } else {
        // Red to Maroon
        r = 255 - (255 * (t - 0.75) * 4);
        g = 0;
        b = 128 + (127 * (t - 0.75) * 4);
    }

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function draw(e) {
    if (!isDrawing) return;

    const currentPoint = { x: e.offsetX, y: e.offsetY };
    currentStroke.push(currentPoint);

    ctx.strokeStyle = dashedCheckbox.checked ? 'violet' : "#999"; // Temporary color for drawing
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(dashedCheckbox.checked ? [10, 20] : []); 

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    [lastX, lastY] = [currentPoint.x, currentPoint.y];
}

function smoothAndApplyGradientToStroke(stroke) {
    const smoothingFactor = smoothingSlider.value;
    ctx.setLineDash(dashedCheckbox.checked ? [10, 20] : []); 

    ctx.strokeStyle = dashedCheckbox.checked ? 'violet' : gradientColormap(0);
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 0; i < stroke.length - 2; i++) {
        const xc = (stroke[i].x + stroke[i + 1].x) / 2;
        const yc = (stroke[i].y + stroke[i + 1].y) / 2;
        const hue = i / (stroke.length - 2);
        ctx.strokeStyle = dashedCheckbox.checked ? 'violet' : gradientColormap(hue);

        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, xc, yc);
        ctx.stroke();

        ctx.beginPath();  // Begin a new path
        ctx.moveTo(xc, yc);
    }

    if (stroke.length > 1) {
        const hue = (stroke.length - 2) / (stroke.length - 1);
        ctx.strokeStyle = dashedCheckbox.checked ? 'violet' : gradientColormap(hue);
        ctx.quadraticCurveTo(stroke[stroke.length - 2].x, stroke[stroke.length - 2].y, stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
        ctx.stroke();
    }

    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(strokeCounter, stroke[0].x, stroke[0].y - 10); 
}


