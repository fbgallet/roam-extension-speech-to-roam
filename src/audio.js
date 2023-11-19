export async function getMediaRecorderStream(audioChunk) {
  const options = {
    audio: true,
  };
  const stream = await navigator.mediaDevices.getUserMedia(options);
  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      // save the data
      audioChunk.current.push(e.data);
    }
  };
  return mediaRecorder;
}
