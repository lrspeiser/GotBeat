# Got Beat README

## Welcome to Got Beat!

Give the game a try at: https://gotbeat.replit.app

### Introduction

Welcome to our rhythm game where your musical timing skills are put to the test! This game is designed to sync with the rhythm of your favorite songs, making every beat count as you aim for the high score. Developed with the assistance of powerful language models, our game is both a technical marvel and a fun experience.

### How It Works

The magic behind this game lies in its ability to analyze songs and generate a unique gameplay experience based on the rhythm and notes detected. Here’s a behind-the-scenes look at how we transform your favorite songs into an interactive game:

1. **Analyzing the Song**: The game starts by analyzing the MP3 file of your song. This involves reading the audio buffer and detecting beats and BPM (beats per minute).
   
2. **Detecting Beats and Pitches**: Using sophisticated algorithms, we detect the beats and pitches in the song. This information is crucial for synchronizing the game elements with the music.

3. **Generating Game Notes**: Based on the detected beats and pitches, the game generates notes. These notes are the targets you’ll be aiming for as you play.

4. **Extracting Metadata**: Metadata such as the song title, artist, and genre are extracted to enrich the gameplay experience.

### Game Setup

1. **Environment Setup**: 
   - Ensure you have Node.js installed.
   - Clone the game repository and navigate to the game directory.
   - Run `npm install` to install necessary dependencies.

2. **Adding Songs**: 
   - Place your MP3 files in the `public/mp3` directory.
   - The game will process these files to create a playable track.

3. **Starting the Game**: 
   - Run the game server using `node index.js <song-name>.mp3`.
   - Open your browser and navigate to the provided local server address.

### Gameplay

Once the game is running, you’ll see a circle of notes and balls that fly out towards the edges of the screen. Your goal is to click on the boxes as the balls pass through them to score points. Here’s what you can expect:

- **Game Interface**: The screen is divided into several boxes, each corresponding to a musical note.
- **Balls and Notes**: Balls will launch from the center of the screen, traveling towards the boxes. Each ball represents a note detected in the song.
- **Scoring Points**: Click on the boxes as the balls pass through them. Perfect timing scores higher points, while missing a ball or clicking too early/late results in a lower score or a penalty.
- **Dynamic Feedback**: The boxes change color based on your accuracy, giving you instant feedback on your performance.

### Scoring System

- **Perfect Hit (Gold)**: 5 points
- **Good Hit (Silver)**: 1 point
- **Missed Hit**: -1 point

### Tips for High Scores

- **Timing is Key**: Aim for the center of the target to maximize your score.
- **Stay Focused**: As the BPM increases, the balls will launch more frequently. Keep your eyes on the screen and react quickly.
- **Practice Makes Perfect**: The more you play, the better you’ll get at synchronizing your actions with the music.

### Conclusion

We hope you enjoy playing our rhythm game as much as we enjoyed creating it. Dive into the beat, hone your timing skills, and aim for the high score!

Happy gaming! 🎵
