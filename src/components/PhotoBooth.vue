<template>
    <div id="wrapper">
        <div class="photobooth">
            <img id="photo" class='photo' :src="url" />
            <canvas id="picture" width="500" height="600" />
            <canvas id="overlay" width="500" height="600" />
        </div>
        <div class="result">
            <canvas id="result" width="300" height="300" />
        </div>
        <div class="controls">
            <span>Scale: {{ squareScale }} <input type="range" class="form-control-range" id="formControlRange" v-model="squareScale" min="1" max="3" step="0.01"></span><br />
            <span>Offset: X: {{ squareOffset.x }} Y: {{ squareOffset.y }}</span>
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

let squareScale = ref(0);
let squareOffset = ref({x: 0, y: 0});

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
    const resultSquare = {
        x: imgWidth * scaled.x + squareOffset.value.x, 
        y: imgHeight * scaled.y + squareOffset.value.y, 
        width: imgWidth * scaled.width, 
        height: imgHeight * scaled.height
    };
    ctx.beginPath();
    ctx.rect(
        resultSquare.x, resultSquare.y, resultSquare.width, resultSquare.height
    );
    ctx.lineWidth = 5;
    ctx.strokeStyle = colors.pop();
    ctx.stroke();

    updateResultCanvas(resultSquare);    
};

const updateResultCanvas = (resultSquare) => {
    const canvas = document.getElementById("picture");
    const resultCanvas = document.getElementById("result");
    const resultCtx = resultCanvas.getContext("2d");
    //resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
    resultCtx.drawImage(canvas, resultSquare.x, resultSquare.y, resultSquare.width, resultSquare.height, 0, 0, resultCanvas.width, resultCanvas.height);
};

const drawImgOnCanvas = () => {
    let inputImgEl = document.getElementById("photo");
    const canvas = document.getElementById("picture");
    const ctx = canvas.getContext("2d");
    const ratio = inputImgEl.width / inputImgEl.height;
    ctx.drawImage(inputImgEl, 0, 0, canvas.width, canvas.height);
};

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

.wrapper {
    display: flex;
}

img.photo {
    display: block;
    width: 500px;
}

.photobooth {
    position: relative;
    margin: 40px;
    flex-grow: 2;
}

.result {
    margin: 40px;
    flex-grow: 2;
}

.result canvas {
    border: 2px solid #ccc;
}

canvas#overlay, canvas#picture {
    position: absolute;
    top: 0;
    left: 0;
}

canvas#picture {
    left: 600px;
    border: 1px solid yellow;
}

.controls {
    color: #ddd;
}
</style>