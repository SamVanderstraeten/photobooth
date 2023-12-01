<template>
    <div id="wrapper">
        <div class="photobooth">
            <img id="photo" class='photo' :src="url" />
            <canvas id="picture" width="500" height="600" />
            <canvas id="overlay" width="500" height="600" />
        </div>
        <div class="output">
            <div class="preview">
                <canvas id="preview" width="300" height="300" />
            </div>
            <div class="controls">
                <span>Scale: {{ squareScale }} <input type="range" class="form-control-range" id="formControlRange" v-model="squareScale" min="1" max="3" step="0.01"></span>
                <span>Offset: X: {{ squareOffset.x }} Y: {{ squareOffset.y }}</span>
                <span class="name-input"><input type="text" v-model="playerName" placeholder="Achternaam" /> <input type="text" v-model="playerFirstName" placeholder="Voornaam" /></span>
                <span><button class="btn btn-primary" @click="downloadPicture" :disabled="invalid()">Download</button></span>
            </div>
        </div>
    </div>
</template>
<script setup>
const props = defineProps({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
});

import * as faceapi from 'face-api.js';
import { watch, ref } from 'vue';

let squareScale = ref(1);
let squareOffset = ref({x: 0, y: 0});
let playerName = ref(''), playerFirstName = ref('');

const invalid = () => {
    console.log(playerName.value, playerFirstName.value);
    return playerName.value == "" || playerFirstName.value == "";
}

const loadNet = async () => {
    let faceDetectionNet = faceapi.nets.tinyFaceDetector;
    await faceDetectionNet.load('/data/weights');
    return faceDetectionNet;
};

const getFaceDetectorOptions = () => {
    let inputSize = 512;
    let scoreThreshold = 0.5;
    return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
};

const detectFace = async () => {
    let inputImgEl = document.getElementById("photo");
    const results = await faceapi.detectSingleFace(inputImgEl, getFaceDetectorOptions());
    return results;
}

const findFace = async () => {
    let face = await detectFace();
    return {
        x: face.relativeBox.x, 
        y: face.relativeBox.y, 
        width: face.relativeBox.width, 
        height: face.relativeBox.height
    };
};

const scaleSquare = (square) => {
    const adjustedWidth = square.width * squareScale.value;
    const adjustedHeight = square.height * squareScale.value;

    return {
        x: square.x - (adjustedWidth - square.width) / 2,
        y: square.y - (adjustedHeight - square.height) / 2,
        width: adjustedWidth,
        height: adjustedHeight
    };
}

const updateSquares = (original, scaled) => {
    let colors = ['blue', 'green'];
    let inputImgEl = document.getElementById("photo");
    const imgWidth = inputImgEl.width;
    const imgHeight = inputImgEl.height;
    const canvas = document.getElementById("overlay");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // draw original face square
    ctx.beginPath();   
    ctx.rect(
        imgWidth * original.x, 
        imgHeight * original.y, 
        imgWidth * original.width, 
        imgHeight * original.height
    );
    ctx.lineWidth = 5;
    ctx.strokeStyle = colors.pop();
    ctx.stroke();

    // draw scaled and offset face square
    const resultRect = {
        x: imgWidth * scaled.x + squareOffset.value.x, 
        y: imgHeight * scaled.y + squareOffset.value.y, 
        width: imgWidth * scaled.width, 
        height: imgHeight * scaled.height
    };
    const resultSquare = squarify(resultRect);
    ctx.beginPath();
    ctx.rect(
        resultSquare.x, resultSquare.y, resultSquare.width, resultSquare.height
    );
    ctx.lineWidth = 5;
    ctx.strokeStyle = colors.pop();
    ctx.stroke();

    updateResultCanvas(resultSquare);    
};

const squarify = (rect) => {
    const ratio = rect.width / rect.height;
    if(ratio > 1) {
        const diff = rect.width - rect.height;
        return {
            x: rect.x + diff / 2,
            y: rect.y,
            width: rect.height,
            height: rect.height
        };
    } else {
        const diff = rect.height - rect.width;
        return {
            x: rect.x,
            y: rect.y + diff / 2,
            width: rect.width,
            height: rect.width
        };
    }
};

// TODO bug: when dev tools is open, results is not updated --> timing issue?
const updateResultCanvas = (resultSquare) => {
    const canvas = document.getElementById("picture");
    const previewCanvas = document.getElementById("preview");
    const previewCtx = previewCanvas.getContext("2d");
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(canvas, resultSquare.x, resultSquare.y, resultSquare.width, resultSquare.height, 0, 0, previewCanvas.width, previewCanvas.height);
};

const drawImgOnCanvas = () => {
    let inputImgEl = document.getElementById("photo");
    const canvas = document.getElementById("picture");
    const ctx = canvas.getContext("2d");
    const ratio = inputImgEl.width / inputImgEl.height;
    ctx.drawImage(inputImgEl, 0, 0, canvas.width, canvas.width/ratio);
};

const downloadPicture = () => {
    let canvasUrl = document.getElementById("preview").toDataURL();
    // Create an anchor, and set the href value to our data URL
    const createEl = document.createElement('a');
    createEl.href = canvasUrl;

    // This is the name of our downloaded file
    createEl.download = `${cap(playerName.value)}-${cap(playerFirstName.value)}.jpg`;

    // Click the download button, causing a download, and then remove it
    createEl.click();
    createEl.remove();
}

const cap = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

loadNet();

let face, scaledFace;
watch( () => props, async (newVal)=> {
    if(newVal.url) {
        drawImgOnCanvas();
        face = await findFace();
        scaledFace = scaleSquare(face);
        updateSquares(face, scaledFace);
    }
}, {deep: true, flush: 'post'});

watch(squareScale, () => {
    scaledFace = scaleSquare(face);
    updateSquares(face, scaledFace);
});

watch(squareOffset, () => {
    updateSquares(face, scaledFace);
});

</script>

<style>

#wrapper {
    display: flex;
}

img.photo {
    display: block;
    width: 500px;
}

.photobooth {
    position: relative;
    margin: 40px;
    flex-grow: 1;
}

.output {
    margin: 40px;
    flex-grow: 1;
}

.preview canvas {
    border: 2px solid #ccc;
}

canvas#overlay, canvas#picture {
    position: absolute;
    top: 0;
    left: 0;
}

/* CONTROLS */
.controls {
    color: #ddd;
}

.controls span {
    display: block;
    margin-bottom: 10px;
}

.controls input[type="text"] {
    padding: 12px;
    font-size: 1em;
}

.btn {
    padding: 12px;
    font-size: 1em;
}

</style>