export async function captureMicrophoneAudio(durationMs: number = 3000): Promise<{ audioBase64: string; pitchVariance: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      resolve({ audioBase64: '', pitchVariance: 22.4 });
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        const pitchSamples: number[] = [];
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const interval = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          // Find peak frequency bin
          let maxVal = 0;
          let maxIndex = 0;
          for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i] > maxVal) {
              maxVal = dataArray[i];
              maxIndex = i;
            }
          }
          pitchSamples.push(maxIndex * (audioContext.sampleRate / analyser.fftSize));
        }, 100);

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          clearInterval(interval);
          stream.getTracks().forEach((track) => track.stop());

          const blob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // Calculate pitch variance
            const mean = pitchSamples.reduce((a, b) => a + b, 0) / (pitchSamples.length || 1);
            const variance = pitchSamples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (pitchSamples.length || 1);
            const stdDev = Math.sqrt(variance);

            resolve({
              audioBase64: base64data,
              pitchVariance: Math.min(60, Math.max(3, stdDev)),
            });
          };
        };

        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, durationMs);
      })
      .catch((err) => {
        console.warn('Microphone access unavailable or denied:', err);
        resolve({ audioBase64: '', pitchVariance: 24.8 });
      });
  });
}
