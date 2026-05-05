export async function captureCamera(mediaRecorder: MediaRecorder): Promise<MediaRecorder> {
    try {
        const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
                video: true
        });

        if (!mediaRecorder) {
            mediaRecorder = new MediaRecorder(stream);
        }

        const videoElement = document.getElementById('video') as HTMLVideoElement;
        videoElement.srcObject = stream;
        const chunks: Blob[]  = [];

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) chunks.push(e.data);
        }

        mediaRecorder.start();
        return await mediaRecorder;
    } catch (error) {
        console.log('Camera error:', error);
        throw new Error("Failed to get media recorder");
    }
}

export async function cameraStop(mediaRecorder: MediaRecorder) {
    mediaRecorder.stop();
    const videoElement = document.getElementById('video') as HTMLVideoElement;
    videoElement.srcObject = null;
}