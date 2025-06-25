#!/bin/bash

# Audio Optimization Script for Learn2Play
# Optimizes audio files for better web performance
# 
# This script helps with:
# - Reducing file sizes for faster loading
# - Creating multiple format versions for better browser compatibility
# - Maintaining quality while optimizing for web delivery

set -e

echo "🎵 Learn2Play Audio Optimization Script"
echo "======================================"

# Check if required tools are installed
check_dependencies() {
    echo "Checking dependencies..."
    
    if ! command -v ffmpeg &> /dev/null; then
        echo "❌ FFmpeg is required but not installed."
        echo "Please install FFmpeg: https://ffmpeg.org/download.html"
        exit 1
    fi
    
    echo "✅ All dependencies found"
}

# Create optimized versions of audio files
optimize_audio_files() {
    local input_dir="public/assets/audio"
    local output_dir="public/assets/audio/optimized"
    
    echo "Optimizing audio files from: $input_dir"
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Process each MP3 file
    for file in "$input_dir"/*.mp3; do
        if [[ -f "$file" ]]; then
            local filename=$(basename "$file" .mp3)
            echo "Processing: $filename"
            
            # Create optimized MP3 (smaller size, web-optimized)
            ffmpeg -i "$file" -codec:a libmp3lame -b:a 128k -ac 2 -ar 44100 -y "$output_dir/${filename}_optimized.mp3" 2>/dev/null
            
            # Create OGG version for better browser compatibility
            ffmpeg -i "$file" -codec:a libvorbis -b:a 128k -ac 2 -ar 44100 -y "$output_dir/${filename}.ogg" 2>/dev/null
            
            # Show file size comparison
            local original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            local optimized_size=$(stat -f%z "$output_dir/${filename}_optimized.mp3" 2>/dev/null || stat -c%s "$output_dir/${filename}_optimized.mp3" 2>/dev/null)
            local savings=$((original_size - optimized_size))
            local percent_savings=$((savings * 100 / original_size))
            
            echo "  Original: $(($original_size / 1024))KB"
            echo "  Optimized: $(($optimized_size / 1024))KB"
            echo "  Savings: $(($savings / 1024))KB (${percent_savings}%)"
            echo "  ✅ Created optimized MP3 and OGG versions"
            echo
        fi
    done
}

# Generate audio manifest for dynamic loading
generate_audio_manifest() {
    local audio_dir="public/assets/audio"
    local manifest_file="public/assets/audio/audio-manifest.json"
    
    echo "Generating audio manifest..."
    
    echo "{" > "$manifest_file"
    echo '  "version": "1.0",' >> "$manifest_file"
    echo '  "generated": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",' >> "$manifest_file"
    echo '  "files": {' >> "$manifest_file"
    
    local first=true
    for file in "$audio_dir"/*.mp3; do
        if [[ -f "$file" ]]; then
            local filename=$(basename "$file" .mp3)
            local filesize=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            
            if [[ $first == false ]]; then
                echo ',' >> "$manifest_file"
            fi
            
            echo "    \"$filename\": {" >> "$manifest_file"
            echo "      \"mp3\": \"/assets/audio/$filename.mp3\"," >> "$manifest_file"
            echo "      \"size\": $filesize," >> "$manifest_file"
            
            # Check if optimized versions exist
            if [[ -f "$audio_dir/optimized/${filename}.ogg" ]]; then
                echo "      \"ogg\": \"/assets/audio/optimized/$filename.ogg\"," >> "$manifest_file"
            fi
            
            if [[ -f "$audio_dir/optimized/${filename}_optimized.mp3" ]]; then
                echo "      \"optimized_mp3\": \"/assets/audio/optimized/${filename}_optimized.mp3\"," >> "$manifest_file"
            fi
            
            echo "      \"type\": \"audio\"" >> "$manifest_file"
            echo -n "    }" >> "$manifest_file"
            
            first=false
        fi
    done
    
    echo "" >> "$manifest_file"
    echo '  }' >> "$manifest_file"
    echo '}' >> "$manifest_file"
    
    echo "✅ Audio manifest generated: $manifest_file"
}

# Analyze current audio setup
analyze_current_setup() {
    local audio_dir="public/assets/audio"
    local total_size=0
    local file_count=0
    
    echo "📊 Current Audio Setup Analysis"
    echo "=============================="
    
    for file in "$audio_dir"/*.mp3; do
        if [[ -f "$file" ]]; then
            local filesize=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            local filename=$(basename "$file")
            total_size=$((total_size + filesize))
            file_count=$((file_count + 1))
            
            printf "%-30s %6dKB\n" "$filename" "$((filesize / 1024))"
        fi
    done
    
    echo "=============================="
    echo "Total files: $file_count"
    echo "Total size: $((total_size / 1024))KB ($((total_size / 1024 / 1024))MB)"
    echo
}

# Main execution
main() {
    check_dependencies
    analyze_current_setup
    
    echo "Choose an option:"
    echo "1. Optimize audio files for web (creates optimized versions)"
    echo "2. Generate audio manifest only"
    echo "3. Full optimization (optimize + manifest)"
    echo "4. Exit"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            optimize_audio_files
            ;;
        2)
            generate_audio_manifest
            ;;
        3)
            optimize_audio_files
            generate_audio_manifest
            ;;
        4)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    echo
    echo "🎉 Audio optimization complete!"
    echo "The optimized files and manifest can be used for better web performance."
    echo "Consider updating your audio loading code to use the optimized versions."
}

# Run main function
main "$@" 