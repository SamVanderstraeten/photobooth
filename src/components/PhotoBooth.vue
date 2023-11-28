<template>
    <div class="photobooth">
        <img id="photo" class='photo' :src="url" />
        <canvas id="overlay" />
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
import { watch } from 'vue';

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
    const results = await faceapi.detectAllFaces(inputImgEl, getFaceDetectorOptions());
    const canvas = document.getElementById("overlay");
    faceapi.matchDimensions(canvas, inputImgEl);
    faceapi.draw.drawDetections(canvas, faceapi.resizeResults(results, inputImgEl));
    return results;
}

const findSquare = async () => {
    let face = await detectFace();
    // TODO move drawing to here?
};

loadNet();

watch( () => props, (newVal)=> {
    if(newVal.url) {
        findSquare();
    }
}, {immediate:true, deep: true});

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
</style>