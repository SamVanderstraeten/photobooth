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
                    <span><button class="btn btn-primary" @click="downloadPicture()">Download picture</button></span>
                </div>
                <div class="preview">
                    <div class="teambox">
                        <canvas id="preview" width="400" height="300" />
                        <div class='teaminfo'>
                            <p><strong>{{teamStore.selectedTeam.type}}</strong></p>
                            <p>{{teamStore.selectedTeam.naam}}</p>
                            <small>(Resultaat zal hogere kwaliteit hebben)</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="shortcuts">
            <p>Offset: Arrows</p>
            <p>Zoom: +/-</p>
            <p>Download: Ctrl+Enter</p>

            <RouterLink to="/"><button class="right">Afsluiten</button></RouterLink>
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

import { watch, ref } from 'vue';
import { useTeamStore } from '../stores/team';
import router from '../router';

let originalImage = ref();
let defaultScale = 1;
let defaultOffset = {x: 0, y: 0};
let rectScale = ref(defaultScale);
let rectOffset = ref(defaultOffset);

let offscreenCanvas, offscreenCtx;

const teamStore = useTeamStore();
if(teamStore.selectedTeam == null) {
    router.push('/');
}

watch( () => props, async (newVal)=> {
    if(newVal.url) {
        updateOriginal(newVal.url);
        

        resetInterface(); 
        drawImgOnCanvas();
        setTimeout(() => {
            updateRect();
        }, 100);
    }
}, {deep: true, flush: 'post'});

const updateOriginal = (url) => {
    originalImage.value = new Image();
    originalImage.value.src = url;

    // create an offscreen canvas to render the image in full resolution
    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = originalImage.value.width;
    offscreenCanvas.height = originalImage.value.height;
    offscreenCtx = offscreenCanvas.getContext('2d');
    // create image with URL
    let image = new Image();
    image.onload = () => {
        offscreenCtx.drawImage(image, 0, 0);
    };
    image.src = url;
};

const resetInterface = () => {
    rectScale.value = defaultScale;
    rectOffset.value = defaultOffset;
}

const drawImgOnCanvas = () => {
    let inputImgEl = document.getElementById("photo");
    const canvas = document.getElementById("picture");
    const ctx = canvas.getContext("2d");
    const ratio = inputImgEl.width / inputImgEl.height;
    ctx.drawImage(inputImgEl, 0, 0, canvas.width, canvas.width/ratio);
};

const updateRect = () => {
    const canvas = document.getElementById("overlay");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let resultRect = getResultRect();

    // draw rectangle
    ctx.beginPath();   
    ctx.rect(
        resultRect.x,
        resultRect.y,
        resultRect.width,
        resultRect.height
    );
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'orange';
    ctx.stroke();

    updateResultCanvas(resultRect);    
};

const getResultRect = () => {
    let inputImgEl = document.getElementById("photo"); // original image

    const imgWidth = inputImgEl.width;
    const imgHeight = inputImgEl.height;

    const RATIO = 4/3;
    let targetHeight = imgHeight * rectScale.value;
    let targetWidth = targetHeight * RATIO;
    if (targetWidth > imgWidth) {
        targetWidth = imgWidth* rectScale.value;
        targetHeight = targetWidth / RATIO;
    }

    let resultRect = {
        x: rectOffset.value.x + imgWidth /2 - targetWidth / 2,
        y: rectOffset.value.y + imgHeight /2 - targetHeight / 2,
        width: targetWidth,
        height: targetHeight,
        original_width: imgWidth,
        original_height: imgHeight
    };

    return resultRect;
}

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

const downloadPicture = () => {
    let resultRect = getResultRect();
    let cropX = resultRect.x * originalImage.value.width / resultRect.original_width;
    let cropY = resultRect.y * originalImage.value.height / resultRect.original_height;
    let cropWidth = resultRect.width * originalImage.value.width / resultRect.original_width;
    let cropHeight = resultRect.height * originalImage.value.height / resultRect.original_height;

    let renderCanvas = document.createElement('canvas');
    renderCanvas.width = 1600; // 4:3 ratio, TODO make this dynamic
    renderCanvas.height = 1200;
    let renderCtx = renderCanvas.getContext('2d');
    renderCtx.drawImage(originalImage.value, cropX, cropY, cropWidth, cropHeight, 0, 0, renderCanvas.width, renderCanvas.height);

    // Create a data URL from the canvas
    let canvasUrl = renderCanvas.toDataURL();

    // Create an anchor, and set the href value to our data URL
    const createEl = document.createElement('a');
    createEl.href = canvasUrl;

    // This is the name of our downloaded file
    createEl.download = `${teamStore.selectedTeam.id}.jpg`;

    // Click the download button, causing a download, and then remove it
    createEl.click();
    createEl.remove();
}

watch(rectScale, () => {
    updateRect();
});

watch(rectOffset, () => {
    updateRect();
});

document.onkeydown = function(evt) {
    // prevent default behavior for arrow keys
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","+","-"].indexOf(evt.key) > -1) {
        evt.preventDefault();
    }
    if(evt.ctrlKey && evt.key == "ArrowUp" || evt.ctrlKey && evt.key == "ArrowRight" || evt.key == "+") {
        rectScale.value = Math.round((rectScale.value - 0.1)*10)/10;
    } else if(evt.ctrlKey && evt.key == "ArrowDown" || evt.ctrlKey && evt.key == "ArrowLeft" || evt.key == "-") {
        rectScale.value = Math.round((rectScale.value + 0.1)*10)/10;
    } else if (evt.key == "ArrowUp") {
        rectOffset.value = {x: rectOffset.value.x, y: rectOffset.value.y - 1};
    } else if (evt.key == "ArrowDown") {
        rectOffset.value = {x: rectOffset.value.x, y: rectOffset.value.y + 1};
    } else if (evt.key == "ArrowLeft") {
        rectOffset.value = {x: rectOffset.value.x - 1, y: rectOffset.value.y};
    } else if (evt.key == "ArrowRight") {
        rectOffset.value = {x: rectOffset.value.x + 1, y: rectOffset.value.y};
    } else if(evt.key == "Escape") {
        resetInterface();
    } else if(evt.ctrlKey && evt.key == "Enter") {
        downloadPicture();
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
    flex-grow: 1;
}

canvas#overlay, canvas#picture {
    position: absolute;
    top: 0;
    left: 0;
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

.teambox {
    width: 402px;   
    border: 1px solid #f9f9f9;
    background: #ED1B25;
    margin: 0 auto;
    margin-top: 32px;
}

.teaminfo {
    font-weight: 700;
    line-height: 1;
    text-align: center;
    padding: 30px 15px 30px 15px;
    color: #fff;
    background: #ED1B25;
}

.teaminfo canvas {
    width: 400px;
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

.right {
    position: absolute;
    right: 20px;
    top: 20px;
    padding: 20px;
    font-size: 1.1em;
}	
</style>