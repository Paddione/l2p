#!/bin/bash

# Script to generate minimal valid MP3 files for the audio system
# This creates 1-second silent MP3 files to prevent 404 errors

AUDIO_DIR="public/assets/audio"

# List of all audio files needed by the application
AUDIO_FILES=(
    "background-music"
    "correct1"
    "correct2"
    "correct3"
    "correct4"
    "correct5"
    "wrong"
    "button-click"
    "button-hover"
    "modal-open"
    "modal-close"
    "notification"
    "error-alert"
    "success-chime"
    "question-start"
    "timer-warning"
    "timer-urgent"
    "game-start"
    "game-end"
    "round-end"
    "player-join"
    "player-leave"
    "player-ready"
    "lobby-created"
    "perfect-score"
    "high-score"
    "streak-bonus"
    "multiplier-max"
    "time-bonus"
    "countdown-tick"
    "whoosh"
    "sparkle"
    "applause"
)

echo "🎵 Generating minimal valid MP3 files..."
echo "Audio directory: $AUDIO_DIR"

# Create audio directory if it doesn't exist
mkdir -p "$AUDIO_DIR"

# Generate each audio file
for file in "${AUDIO_FILES[@]}"; do
    output_file="$AUDIO_DIR/${file}.mp3"
    
    # Check if file exists and is empty (0 bytes)
    if [[ ! -f "$output_file" ]] || [[ ! -s "$output_file" ]]; then
        echo "Generating: ${file}.mp3"
        
        # Generate 1 second of silence as MP3
        # -f lavfi: Use libavfilter virtual input
        # -i anullsrc: Generate silent audio
        # -t 1: Duration of 1 second
        # -c:a mp3: Use MP3 codec
        # -b:a 32k: Low bitrate to keep files small
        # -ar 22050: Low sample rate to keep files small
        # -ac 1: Mono audio
        ffmpeg -f lavfi -i anullsrc=channel_layout=mono:sample_rate=22050 \
               -t 1 -c:a mp3 -b:a 32k -ar 22050 -ac 1 \
               "$output_file" -y -loglevel quiet
        
        if [[ $? -eq 0 ]]; then
            echo "✅ Created: ${file}.mp3 ($(stat -c%s "$output_file") bytes)"
        else
            echo "❌ Failed to create: ${file}.mp3"
        fi
    else
        echo "⏭️  Skipping: ${file}.mp3 (already exists and has content)"
    fi
done

echo ""
echo "🎉 Audio file generation complete!"
echo ""
echo "📊 Summary:"
ls -la "$AUDIO_DIR"/*.mp3 | awk '{print $9 " - " $5 " bytes"}'

echo ""
echo "🔧 Next steps:"
echo "1. Restart the containers to ensure the new files are served correctly"
echo "2. Test the audio system in the browser"
echo ""
echo "To restart containers:"
echo "  docker compose restart quiz-app" 