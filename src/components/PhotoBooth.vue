<template>
    <div id="wrapper" @keyup.enter="testKey">
        <div class="photobooth">
            <img id="photo" class='photo' :src="url" @keypress.tab="testKey" />
            <canvas id="overlay" width="500" height="600" @keypress.ctrl="testKey" />
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

const testKey = () => {
    console.log('test');
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

const drawSquares = (original, scaled) => {
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
    ctx.beginPath();
    ctx.rect(
        imgWidth * scaled.x + squareOffset.value.x, 
        imgHeight * scaled.y + squareOffset.value.y, 
        imgWidth * scaled.width, 
        imgHeight * scaled.height
    );
    ctx.lineWidth = 5;
    ctx.strokeStyle = colors.pop();
    ctx.stroke();
    
};

loadNet();

let face, scaledFace;
watch( () => props, async (newVal)=> {
    if(newVal.url) {
        face = await findFace();
        scaledFace = scaleSquare(face);
        drawSquares(face, scaledFace);
    }
}, {immediate:true, deep: true});

watch(squareScale, () => {
    scaledFace = scaleSquare(face);
    drawSquares(face, scaledFace);
});

watch(squareOffset, () => {
    drawSquares(face, scaledFace);
});

</script>

<style>

img.photo {
    display: block;
    width: 500px;
}

.photobooth {
    position: relative;
    margin: 40px;
}

canvas#overlay {
    position: absolute;
    top: 0;
    left: 0;
}

.controls {
    color: white;
}
</style>