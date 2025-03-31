const { ipcRenderer } = require('electron');

const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

videoSelectBtn.onclick = getVideoSources;
startBtn.onclick = startRecording;
stopBtn.onclick = stopRecording;

async function getVideoSources() {
    try {
        const inputSources = await ipcRenderer.invoke('get-video-sources');
        const menuItems = inputSources.map(source => ({
            label: source.name,
            id: source.id
        }));

        ipcRenderer.send('show-context-menu', menuItems);
    } catch (error) {
        console.error("Error getting video sources:", error);
    }
}

ipcRenderer.on('selected-source', (event, sourceId) => {
    selectSource({ id: sourceId, name: "Selected Video Source" });
});

let mediaRecorder;
let recordedChunks = [];

async function selectSource(source) {
    try {
        videoSelectBtn.innerText = source.name;

        const constraints = {
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: source.id
                }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        videoElement.play();

        const options = { mimeType: 'video/webm; codecs=vp9' };
        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleStop;
    } catch (error) {
        console.error("Error selecting source:", error);
    }
}

// ✅ Start Recording with Button Style Changes
function startRecording() {
    if (!mediaRecorder) {
        console.error("MediaRecorder not initialized!");
        return;
    }
    recordedChunks = [];
    mediaRecorder.start();
    console.log("Recording started");

    // ✅ Change button to red with "Recording..."
    startBtn.style.backgroundColor = "red";
    startBtn.innerText = "Recording...";
    startBtn.disabled = true;
    stopBtn.disabled = false;
}

// ✅ Stop Recording with Button Reset
function stopRecording() {
    if (!mediaRecorder) {
        console.error("MediaRecorder not initialized!");
        return;
    }
    mediaRecorder.stop();
    console.log("Recording stopped");

    // ✅ Reset button back to green with "Start Recording"
    startBtn.style.backgroundColor = "green";
    startBtn.innerText = "Start Recording";
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

function handleDataAvailable(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

async function handleStop() {
    try {
        const blob = new Blob(recordedChunks, { type: 'video/webm; codecs=vp9' });
        const buffer = Buffer.from(await blob.arrayBuffer());

        // Send buffer to main process for saving
        ipcRenderer.send('save-video', buffer);
    } catch (error) {
        console.error("Error saving video:", error);
    }
}
