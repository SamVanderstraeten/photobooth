<template>
    <div id="wrapper">
        <div class="photobooth">
            <img id="photo" class='photo' :src="url" />
            <canvas id="picture" width="500" height="600" />
            <canvas id="overlay" width="500" height="600" />
        </div>

        <div class="sidebar">
            <div class="top">
                <div class="controls">
                    <span v-for="player in teamStore.selectedTeamPlayers" :key="player.lidnummer" @click="playerSelected(player)" class="player-name">{{ player.voornaam }} {{  player.naam }}</span>

                    <p> 
                        <span>Speler staat niet in de lijst:</span>
                        <span class="small">(geef dan hier onder de volledige naam in)</span>
                        <span class="name-input"><input type="text" v-model="playerFirstName" id="namefocus" placeholder="Voornaam" /> <input type="text" v-model="playerName" placeholder="Achternaam" /></span>
                    </p>
                    <span><button class="btn btn-primary" @click="downloadPicture" :disabled="invalid()">Download picture</button></span>
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

            <div class="shortcuts">
                <p>Offset: Arrows</p>
                <p>Zoom: +/-</p>
                <p>Download: Ctrl+Enter</p>
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
import { useTeamStore } from '../stores/team';
import router from '../router';

let defaultScale = 2.3;
let defaultOffset = {x: 0, y: 0};
let squareScale = ref(defaultScale);
let squareOffset = ref(defaultOffset);
let playerName = ref(''), playerFirstName = ref('');
let originalImage = ref();

const emit = defineEmits(['nextPicture']);

const teamStore = useTeamStore();
teamStore.fetchTeam().then(() => {
    if(teamStore.selectedTeamPlayers.length == 0) {
        router.push('/');
    }
});

const playerSelected = (player) => {
    playerName.value = player.naam;
    playerFirstName.value = player.voornaam;
};

const invalid = () => {
    return playerName.value == "" || playerFirstName.value == "";
}

const loadNet = async () => {
    let faceDetectionNet = faceapi.nets.tinyFaceDetector;
    //await faceDetectionNet.load('/photobooth/data/weights'); // hosted on <main URL>/photobooth
    await faceDetectionNet.loadFromUri('/data/weights'); // local
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

// 'face' contains the face coordinates on the original image
// coordinates are relative to the image size (0-1)
const determineAdjustedSquare = (face) => {
    // Calculate the resulting width and height of the face square
    const adjustedWidth = face.width * squareScale.value;
    const adjustedHeight = face.height * squareScale.value;

    // Calculate the starting x and y coordinates of the resulting face square
    let calcX = face.x - (adjustedWidth - face.width) / 2;
    let calcY = face.y - (adjustedHeight - face.height) / 2;

    let resultRect = {
        x: calcX > 0 ? calcX : 0,
        y: calcY > 0 ? calcY : 0,
        width: adjustedWidth,
        height: adjustedHeight
    };

    return resultRect;
}

const updateSquares = (original, scaled) => {
    let colors = ['orange', 'yellow'];
    let inputImgEl = document.getElementById("photo"); // original image
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
    // scaled is still in relative dimensions (0-1)
    let resultRect = {
        x: imgWidth * scaled.x + squareOffset.value.x, 
        y: imgHeight * scaled.y + squareOffset.value.y, 
        width: imgWidth * scaled.width, 
        height: imgHeight * scaled.height
    };

    resultRect = squarify(resultRect);

    ctx.beginPath();
    ctx.rect(resultRect.x, resultRect.y, resultRect.width, resultRect.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = colors.pop();
    ctx.stroke();

    updateResultCanvas(resultRect);    
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

const resetInterface = () => {
    squareScale.value = defaultScale;
    squareOffset.value = defaultOffset;

    playerFirstName.value = "";
    playerName.value = "";
    document.getElementById("namefocus").focus();
}

loadNet();

let face;
watch( () => props, async (newVal)=> {
    if(newVal.url) {
        updateOriginal(newVal.url);
        resetInterface(); 
        drawImgOnCanvas();
        face = await findFace();
        let scaledFace = determineAdjustedSquare(face);
        updateSquares(face, scaledFace);               
    }
}, {deep: true, flush: 'post'});

watch(squareScale, () => {
    let scaledFace = determineAdjustedSquare(face);
    updateSquares(face, scaledFace);
});

watch(squareOffset, () => {
    let scaledFace = determineAdjustedSquare(face);
    updateSquares(face, scaledFace);
});

document.onkeydown = function(evt) {
    // prevent default behavior for arrow keys
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","+","-"].indexOf(evt.key) > -1) {
        evt.preventDefault();
    }
    if(evt.ctrlKey && evt.key == "ArrowUp" || evt.ctrlKey && evt.key == "ArrowRight" || evt.key == "+") {
        squareScale.value = Math.round((squareScale.value - 0.1)*10)/10;
    } else if(evt.ctrlKey && evt.key == "ArrowDown" || evt.ctrlKey && evt.key == "ArrowLeft" || evt.key == "-") {
        squareScale.value = Math.round((squareScale.value + 0.1)*10)/10;
    } else if (evt.key == "ArrowUp") {
        squareOffset.value = {x: squareOffset.value.x, y: squareOffset.value.y - 1};
    } else if (evt.key == "ArrowDown") {
        squareOffset.value = {x: squareOffset.value.x, y: squareOffset.value.y + 1};
    } else if (evt.key == "ArrowLeft") {
        squareOffset.value = {x: squareOffset.value.x - 1, y: squareOffset.value.y};
    } else if (evt.key == "ArrowRight") {
        squareOffset.value = {x: squareOffset.value.x + 1, y: squareOffset.value.y};
    } else if(evt.key == "Escape") {
        resetInterface();
    } else if(evt.ctrlKey && evt.key == "Enter") {
        downloadPicture();
        emit('nextPicture');
    } 
};

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
}

.controls span.small {
    font-size: 0.7em;
}

.controls .player-name {
    display: inline-block;
    padding: 10px;
    margin: 5px;
    background-color: #ED1B25;
    color: #fff;
    cursor: pointer;
}

.controls .player-name:hover {
    background-color: #f9f9f9;
    color: #ED1B25;
}

.controls p {
    margin-top: 60px;
}

.controls input[type="text"] {
    padding: 12px;
    font-size: 1em;
}

.btn {
    padding: 12px;
    font-size: 1em;
    margin-top: 60px;
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
    margin: 0 auto;
    margin-top: 32px;
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

.sidebar {
    display: flex;
    flex-direction: column;
    flex-grow: 4;
    position: relative;
}

.shortcuts {
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 10px;
    background: #ED1B25;
    color: #fff;
    font-size: 0.8em;
    width: 100%;
}

.top {
    display: flex;
    height: 100%;
}
</style>