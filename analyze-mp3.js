const fs = require("fs");
const path = require("path");
const { AudioContext } = require("web-audio-api");
const MidiWriter = require("midi-writer-js");
const pitchFinder = require("pitchfinder");

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MIN_NOTE_INTERVAL = 0.25; // Minimum interval in seconds between notes

async function analyzeMp3(filePath) {
  const startTime = Date.now();
  try {
    console.log('[analyzeMp3] Starting analysis of:', filePath);

    const audioBuffer = await readAudioBuffer(filePath);
    console.log(`[analyzeMp3] Audio buffer read successfully (${Date.now() - startTime}ms)`);

    console.log('[analyzeMp3] Detecting beats and BPM...');
    const beatStartTime = Date.now();
    const { beatSequence, bpm } = detectBeatsAndBPM(audioBuffer);
    console.log(`[analyzeMp3] Beat detection complete. Detected ${beatSequence.length} beats, BPM: ${bpm} (${Date.now() - beatStartTime}ms)`);

    console.log('[analyzeMp3] Detecting pitches...');
    const pitchStartTime = Date.now();
    const pitches = await detectPitches(audioBuffer);
    console.log(`[analyzeMp3] Pitch detection complete. Detected ${pitches.length} pitches (${Date.now() - pitchStartTime}ms)`);

    console.log('[analyzeMp3] Extracting metadata...');
    const metadataStartTime = Date.now();
    const mm = await import('music-metadata');
    const metadata = await mm.parseFile(filePath);
    console.log(`[analyzeMp3] Metadata extraction complete (${Date.now() - metadataStartTime}ms)`);

    console.log('[analyzeMp3] Generating game notes...');
    const gameNotesStartTime = Date.now();
    const gameNotes = generateGameNotes(beatSequence, pitches, bpm);
    console.log(`[analyzeMp3] Game notes generation complete (${Date.now() - gameNotesStartTime}ms)`);

    const songData = {
      duration: audioBuffer.duration,
      bpm: bpm,
      songStartTime: 2,
      ballLaunchDelay: 2,
      notes: gameNotes,
      metadata: {
        title: metadata.common.title,
        artist: metadata.common.artist,
        album: metadata.common.album,
        year: metadata.common.year,
        genre: metadata.common.genre
      }
    };

    const jsonPath = filePath.replace('.mp3', '.json').replace('mp3', 'songdata');
    fs.writeFileSync(jsonPath, JSON.stringify(songData, null, 2));
    console.log(`[analyzeMp3] Song data JSON saved to ${jsonPath}`);

    console.log(`[analyzeMp3] Analysis complete. Total time: ${Date.now() - startTime}ms`);
    return songData;
  } catch (error) {
    console.error(`[analyzeMp3] Error during analysis (${Date.now() - startTime}ms):`, error);
    throw error;
  }
}

function readAudioBuffer(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, buffer) => {
      if (err) {
        console.error("[readAudioBuffer] Error reading file:", err);
        reject(err);
        return;
      }
      const audioContext = new AudioContext();
      audioContext.decodeAudioData(
        buffer,
        (audioBuffer) => {
          console.log("[readAudioBuffer] Audio buffer decoded:", audioBuffer);
          resolve(audioBuffer);
        },
        (error) => {
          console.error(
            "[readAudioBuffer] Error decoding audio buffer:",
            error,
          );
          reject(error);
        },
      );
    });
  });
}

function detectBeatsAndBPM(audioBuffer) {
  console.log('[detectBeatsAndBPM] Starting custom beat detection');
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  const minBPM = 30; // Lowered to account for slower songs
  const maxBPM = 200;
  const bufferSize = Math.floor(sampleRate / 4); // 0.25 second buffer for more precision
  const beatThreshold = 0.15; // Lowered for higher sensitivity

  const beatSequence = [];
  let energyHistory = [];
  let lastBeatTime = -1;

  for (let i = 0; i < channelData.length; i += bufferSize) {
    if (i % (bufferSize * 40) === 0) {
      console.log(`[detectBeatsAndBPM] Processed ${(i / channelData.length * 100).toFixed(2)}% of audio`);
    }

    const chunk = channelData.slice(i, i + bufferSize);
    const energy = calculateEnergy(chunk);
    energyHistory.push(energy);

    if (energyHistory.length > 43) {
      energyHistory.shift();
    }

    const averageEnergy = energyHistory.reduce((sum, e) => sum + e, 0) / energyHistory.length;
    const currentTime = i / sampleRate;

    if (energy > averageEnergy * (1 + beatThreshold) && currentTime - lastBeatTime > 60 / maxBPM) {
      beatSequence.push({ time: currentTime });
      lastBeatTime = currentTime;
    }
  }

  const bpm = calculateBPM(beatSequence, audioBuffer.duration);

  console.log(`[detectBeatsAndBPM] Beat detection complete. Detected ${beatSequence.length} beats, BPM: ${bpm}`);
  return { beatSequence, bpm };
}

function calculateEnergy(buffer) {
  return buffer.reduce((sum, sample) => sum + sample * sample, 0) / buffer.length;
}

function calculateBPM(beatSequence, duration) {
  if (beatSequence.length < 2) return 0;

  const intervals = [];
  for (let i = 1; i < beatSequence.length; i++) {
    intervals.push(beatSequence[i].time - beatSequence[i - 1].time);
  }

  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const bpm = Math.round(60 / averageInterval);

  return bpm;
}

async function detectPitches(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const detectPitch = pitchFinder.YIN({ sampleRate: sampleRate });

  const pitches = [];
  const chunkSize = Math.floor(sampleRate / 20); // 50ms chunks

  for (let i = 0; i < channelData.length; i += chunkSize) {
    const chunk = channelData.slice(i, i + chunkSize);
    const time = i / sampleRate;

    const pitch = detectPitch(chunk);
    if (pitch) {
      pitches.push({ time, pitch });
    }
  }

  return pitches;
}



function generateGameNotes(beatSequence, pitches, bpm) {
  console.log(`[generateGameNotes] Generating notes for ${beatSequence.length} beats`);

  const gameNotes = [];

  for (let i = 0; i < beatSequence.length; i++) {
    const beat = beatSequence[i];
    const nextBeat = beatSequence[i + 1] || { time: beat.time + 60 / bpm }; // Estimate next beat if it's the last one

    const closestPitch = pitches.reduce((closest, current) =>
      Math.abs(current.time - beat.time) < Math.abs(closest.time - beat.time) ? current : closest
    );

    const midiNote = frequencyToMidiNote(closestPitch.pitch);
    const noteName = midiNoteToNoteName(midiNote);

    gameNotes.push({
      note: noteName,
      startTime: beat.time,
      duration: nextBeat.time - beat.time,
      endTime: nextBeat.time,
      velocity: 100
    });
  }

  console.log(`[generateGameNotes] Generated ${gameNotes.length} game notes`);
  return gameNotes;
}

function frequencyToMidiNote(frequency) {
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

function midiNoteToNoteName(midiNote) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return notes[midiNote % 12];
}

async function processFile(fileName) {
  try {
    const mp3Path = path.join(__dirname, "public", "mp3", fileName);
    console.log(`[processFile] Starting analysis for file: ${mp3Path}`);
    const analysisResult = await analyzeMp3(mp3Path);

    console.log(`[processFile] Analysis complete for ${fileName}`);
    console.log(`[processFile] Duration: ${analysisResult.duration}`);
    console.log(`[processFile] BPM: ${analysisResult.bpm}`);
    console.log(`[processFile] Key: ${analysisResult.key}`);
    console.log(
      `[processFile] Song start time: ${analysisResult.songStartTime}`,
    );
    console.log(
      `[processFile] Ball launch delay: ${analysisResult.ballLaunchDelay}`,
    );
    console.log(`[processFile] Metadata:`, analysisResult.metadata);
  } catch (error) {
    console.error(`[processFile] Error processing file ${fileName}:`, error);
  }
}

const fileNameToProcess = process.argv[2];
if (!fileNameToProcess) {
  console.error("[main] Please provide an MP3 file name as an argument.");
} else {
  console.log(`[main] Processing file: ${fileNameToProcess}`);
  processFile(fileNameToProcess);
}
