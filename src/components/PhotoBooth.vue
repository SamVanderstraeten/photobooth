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
                    <span v-for="(person, index) in presetNames()" :key="index" @click="playerSelected(person)" class="player-name" :class="{'selected': isSelected(person)}">{{ person.voornaam }} {{  person.naam }}</span>

                    <p>
                        <span>{{ teamStore.photoType === 'coach' ? 'Coach' : 'Speler' }} staat niet in de lijst:</span>
                        <span class="small">(geef dan hier onder de volledige naam in)</span>
                        <span class="name-input"><input type="text" v-model="playerFirstName" id="namefocus" placeholder="Voornaam" /> <input type="text" v-model="playerName" placeholder="Achternaam" /></span>
                    </p>
                    <span><button class="btn btn-primary" @click="downloadPicture" :disabled="invalid()">Download picture</button></span>
                </div>
                <!-- new picture and the current one on the website side by side, to compare them -->
                <div class="preview">
                    <div class="compare">
                        <p class="compare-title">Nieuwe foto</p>
                        <div class="playerbox">
                            <img v-if="teamStore.keepOriginal" class="original-preview" :src="url" />
                            <canvas v-else id="preview" width="300" height="300" />
                            <div class='playerinfo'>
                                <p>{{ playerFirstName }} {{ playerName }}</p>
                                <p class="light">2024</p>
                                <p class="light">Lidnummer: 1234567</p>
                            </div>
                        </div>
                    </div>

                    <div class="compare">
                        <p class="compare-title">Huidige foto op de website</p>
                        <div class="current-photo">
                            <span v-if="invalid()">Kies een naam</span>
                            <template v-else>
                                <img v-show="!currentPhotoMissing" :key="currentPhotoUrl" :src="currentPhotoUrl" @error="currentPhotoMissing = true" />
                                <span v-if="currentPhotoMissing">Geen foto gevonden</span>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <div class="shortcuts">
                <template v-if="!teamStore.keepOriginal">
                    <p>Offset: Arrows</p>
                    <p>Zoom: +/-</p>
                </template>
                <p>Volgende naam: Tab</p>
                <p>Download: Ctrl+Enter</p>

                <RouterLink to="/"><button class="right">Afsluiten</button></RouterLink>
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
import { watch, ref, computed, onMounted } from 'vue';
import { useTeamStore } from '../stores/team';

let defaultScale = 2.3;
let defaultOffset = {x: 0, y: 0};
let squareScale = ref(defaultScale);
let squareOffset = ref(defaultOffset);
let playerName = ref(''), playerFirstName = ref('');
let originalImage = ref();

const emit = defineEmits(['nextPicture']);

const teamStore = useTeamStore();

// last name picked from the list, so Tab continues from there (also after switching pictures)
let lastSelectedIndex = -1;

// only the players or only the coaches, depending on the kind of picture
const presetNames = () => teamStore.photoType === 'coach' ? teamStore.selectedTeamCoaches : teamStore.selectedTeamPlayers;

watch(() => teamStore.photoType, () => {
    lastSelectedIndex = -1;
});

const playerSelected = (player) => {
    lastSelectedIndex = presetNames().indexOf(player);
    playerName.value = player.naam;
    playerFirstName.value = player.voornaam;
};

const isSelected = (player) => {
    return player.naam === playerName.value && player.voornaam === playerFirstName.value;
};

const selectNextName = (step) => {
    const names = presetNames();
    if(names.length == 0) return;

    // nothing picked yet: start at the first (Tab) or last (Shift+Tab) name, otherwise wrap around
    const index = lastSelectedIndex < 0
        ? (step > 0 ? 0 : names.length - 1)
        : (lastSelectedIndex + step + names.length) % names.length;
    playerSelected(names[index]);
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
    if(!face) {
        return null;
    }
    
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
    // This is the name of our downloaded file
    const createEl = document.createElement('a');

    if(teamStore.keepOriginal) {
        // original format: download the uploaded file untouched, only the name changes
        const extension = (props.name.match(/\.[^.]+$/) || ['.jpg'])[0];
        createEl.href = props.url;
        createEl.download = `${fileName.value}${extension}`;
    } else {
        // Create an anchor, and set the href value to our data URL
        createEl.href = document.getElementById("preview").toDataURL();
        createEl.download = `${fileName.value}.jpg`;
    }

    // Click the download button, causing a download, and then remove it
    createEl.click();
    createEl.remove();
}

const cap = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const norm = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// name of the stored picture (<Achternaam>-<Voornaam>), the same as on the website
const fileName = computed(() => `${norm(cap(playerName.value))}-${norm(cap(playerFirstName.value))}`);

const currentPhotoUrl = computed(() => `https://www.gemsdiepenbeek.be/assets/players/${encodeURIComponent(fileName.value)}.jpg`);
const currentPhotoMissing = ref(false);
watch(currentPhotoUrl, () => {
    currentPhotoMissing.value = false;
});

const updateOriginal = (url) => {
    originalImage.value = new Image();
    originalImage.value.src = url;
    return waitForImage(originalImage.value);
};

// resolves once the image element has finished loading its current src
const waitForImage = (img) => {
    if(img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        img.addEventListener('load', resolve, {once: true});
        img.addEventListener('error', reject, {once: true});
    });
};

const resetInterface = () => {
    squareScale.value = defaultScale;
    squareOffset.value = defaultOffset;

    playerFirstName.value = "";
    playerName.value = "";
    document.getElementById("namefocus").focus();
}

// face detection is only needed when cutting out a square, so the model is loaded on first use
let netLoaded = null;

let face;
let detectionRun = 0;
const detectFaceSquare = async (url) => {
    // ignore results of an older run when the picture changes mid-detection
    const run = ++detectionRun;
    face = null;
    clearCanvas("picture");
    clearCanvas("overlay");
    if(teamStore.keepOriginal || !url) return;

    // face detection needs the model and the loaded picture
    netLoaded = netLoaded || loadNet();
    await Promise.all([
        netLoaded,
        updateOriginal(url),
        waitForImage(document.getElementById("photo"))
    ]);
    if(run !== detectionRun) return;

    drawImgOnCanvas();
    const foundFace = await findFace();
    if(run !== detectionRun || !foundFace) return;

    face = foundFace;
    let scaledFace = determineAdjustedSquare(face);
    updateSquares(face, scaledFace);
};

const clearCanvas = (id) => {
    const canvas = document.getElementById(id);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
};

watch( () => props, async (newVal)=> {
    if(newVal.url) {
        resetInterface();
        detectFaceSquare(newVal.url);
    }
}, {deep: true, flush: 'post'});

// switching between original format and square cut-out keeps the chosen name
watch(() => teamStore.keepOriginal, () => {
    squareScale.value = defaultScale;
    squareOffset.value = defaultOffset;
    detectFaceSquare(props.url);
}, {flush: 'post'});

// coming back from the team picture: the selected picture is already there
onMounted(() => {
    if(props.url) {
        detectFaceSquare(props.url);
    }
});

watch(squareScale, () => {
    if(!face) return;
    let scaledFace = determineAdjustedSquare(face);
    updateSquares(face, scaledFace);
});

watch(squareOffset, () => {
    if(!face) return;
    let scaledFace = determineAdjustedSquare(face);
    updateSquares(face, scaledFace);
});

document.onkeydown = function(evt) {
    // prevent default behavior for arrow keys
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","+","-","Tab"].indexOf(evt.key) > -1) {
        evt.preventDefault();
    }
    if(evt.key == "Tab") {
        selectNextName(evt.shiftKey ? -1 : 1);
    } else if(evt.ctrlKey && evt.key == "Enter") {
        downloadPicture();
        emit('nextPicture');
    } else if(evt.key == "Escape") {
        resetInterface();
    } else if(teamStore.keepOriginal) {
        // no offset or zoom on the original picture
        return;
    } else if(evt.ctrlKey && evt.key == "ArrowUp" || evt.ctrlKey && evt.key == "ArrowRight" || evt.key == "+") {
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
    }
};

</script>

<style scoped>

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
    flex: 0 0 auto;
}

canvas#overlay, canvas#picture {
    position: absolute;
    top: 0;
    left: 0;
}

/* CONTROLS */
.controls {
    color: #ddd;
    padding: 24px;
    flex: 1 1 auto;
    min-width: 0;
    overflow-y: auto;
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

.controls .player-name:hover,
.controls .player-name.selected {
    background-color: #f9f9f9;
    color: #ED1B25;
}

.controls p {
    margin-top: 32px;
}

.controls input[type="text"] {
    padding: 12px;
    font-size: 1em;
}

.btn {
    padding: 12px;
    font-size: 1em;
    margin-top: 24px;
}

/* PREVIEW: new picture next to the current one on the website */
.preview {
    flex: 0 0 auto;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 24px;
    overflow-y: auto;
}

.compare {
    width: clamp(180px, 15vw, 300px);
}

.compare-title {
    color: #ddd;
    font-size: 0.8em;
    text-align: center;
    margin-bottom: 8px;
}

.playerbox {
    border: 1px solid #f9f9f9;
    background: #ED1B25;
}

.playerinfo {
    font-weight: 700;
    line-height: 1;
    text-align: center;
    padding: 20px 10px;
    color: #fff;
    background: #ED1B25;
}

.playerbox canvas,
.playerbox .original-preview {
    display: block;
    width: 100%;
}

.playerbox canvas,
.playerbox .original-preview,
.current-photo img {
    height: auto;
}

.current-photo {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: clamp(180px, 15vw, 300px);
    border: 1px solid #f9f9f9;
    color: #999;
    font-size: 0.8em;
    text-align: center;
}

.current-photo img {
    display: block;
    width: 100%;
}

.light {
    line-height: 0.9;
    font-weight: 300;
}

.sidebar {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-width: 0;
    background-color: #30353c;
}

.top {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
}

.shortcuts {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 10px;
    background: #ED1B25;
    color: #fff;
    font-size: 0.8em;
}

.shortcuts a {
    margin-left: auto;
}

.right {
    padding: 12px 20px;
    font-size: 1.1em;
}
</style>
