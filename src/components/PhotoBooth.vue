<template>
    <div id="wrapper">
        <div class="photobooth">
            <img id="photo" class='photo' :src="url" />
            <canvas id="picture" width="500" height="600" />
            <canvas id="overlay" width="500" height="600" />
        </div>
        <div class="controls">
            <span>Scale: {{ squareScale }} <input type="range" class="form-control-range" id="formControlRange" v-model="squareScale" min="1" max="4" step="0.1"></span>
            <span>Offset: X: {{ squareOffset.x }} Y: {{ squareOffset.y }}</span>
            <span class="name-input"><input type="text" v-model="playerFirstName" placeholder="Voornaam" /> <input type="text" v-model="playerName" placeholder="Achternaam" /></span>
            <span><button class="btn btn-primary" @click="downloadPicture" :disabled="invalid()">Download</button></span>
        </div>
        <div class="preview">
            <div class="playerbox">
                <canvas id="preview" width="300" height="300" />
                <div class='playerinfo'>
                    <p>{{ playerFirstName }} {{ playerName }}</p>
                    <p class="light">2024</p>
                    <p class="light">Lidnummer: 1234567</p>
                </div>
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

let squareScale = ref(2.3);
let squareOffset = ref({x: 0, y: 0});
let playerName = ref(''), playerFirstName = ref('');
let originalImage = ref();

const invalid = () => {
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

const scaleAndOffsetSquare = (square) => {
    const adjustedWidth = square.width * squareScale.value;
    const adjustedHeight = square.height * squareScale.value;

    let calcX = square.x - (adjustedWidth - square.width) / 2 + squareOffset.value.x;
    let calcY = square.y - (adjustedHeight - square.height) / 2 + squareOffset.value.y;

    return {
        x: calcX > 0 ? calcX : 0,
        y: calcY > 0 ? calcY : 0,
        width: adjustedWidth,
        height: adjustedHeight
    };
}

const updateSquares = (original, scaled) => {
    let colors = ['orange', 'yellow'];
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
    ctx.lineWidth = 2;
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
    ctx.rect(resultSquare.x, resultSquare.y, resultSquare.width, resultSquare.height);
    ctx.lineWidth = 2;
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

// TODO bug: when dev tools is open, result is not updated --> timing issue?
const updateResultCanvas = (resultSquare) => {
    const previewCanvas = document.getElementById("preview");
    const previewCtx = previewCanvas.getContext("2d");
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    let inputImgEl = document.getElementById("photo");
    let scaleX = originalImage.value.width / inputImgEl.width;
    let scaleY = originalImage.value.height / inputImgEl.height;

    let cropX = resultSquare.x * scaleX;
    let cropY = resultSquare.y * scaleY;
    let cropWidth = resultSquare.width * scaleX;
    let cropHeight = resultSquare.height * scaleY;
    previewCtx.drawImage(originalImage.value, cropX, cropY, cropWidth, cropHeight, 0, 0, previewCanvas.width, previewCanvas.height);
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

const updateOriginal = (url) => {
    originalImage.value = new Image();
    originalImage.value.src = url;
};

loadNet();

let face, scaledFace;
watch( () => props, async (newVal)=> {
    if(newVal.url) {
        updateOriginal(newVal.url);
        drawImgOnCanvas();
        face = await findFace();
        scaledFace = scaleAndOffsetSquare(face);
        updateSquares(face, scaledFace);
    }
}, {deep: true, flush: 'post'});

watch(squareScale, () => {
    scaledFace = scaleAndOffsetSquare(face);
    updateSquares(face, scaledFace);
});

watch(squareOffset, () => {
    updateSquares(face, scaledFace);
});

</script>

<style>

#wrapper {
    display: flex;
    height: 100%;
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

canvas#overlay, canvas#picture {
    position: absolute;
    top: 0;
    left: 0;
}

/* CONTROLS */
.controls {
    color: #ddd;
    padding: 40px;
    flex-grow: 3;
    background-color: #30353c;
    position: relative;
    height: 100%;
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

.preview {
    padding: 40px;
    flex-grow: 3;
    background-color: #30353c;
    position: relative;
    height: 100%;
}

.playerbox {
    width: 301px;   
    border: 1px solid #f9f9f9;
    background: #ED1B25;
}

.playerinfo {
    font-weight: 700;
    line-height: 1;
    text-align: center;
    padding: 30px 15px 30px 15px;
    color: #fff;
    background: #ED1B25;
}

.playerinfo canvas {
    width: 300px;
    height: 300px;
}

.light {
    line-height: 0.9;
    font-weight: 300;
}

</style>