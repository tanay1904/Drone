#!/bin/bash
set -e

echo "Building all firmware targets..."

boards=("qemu_cortex_m3" "qemu_cortex_m7")
apps=("stm32n6" "stm32wl" "lora_e5")

for app in "${apps[@]}"; do
    for board in "${boards[@]}"; do
        echo "Building $app for $board..."
        cd firmware/$app
        west build -p auto -b $board
        cd ../..
    done
done

echo "All builds complete!"
