#!/bin/bash
FIRMWARE=${1:-stm32n6}
BOARD=${2:-lora_e5_mini}

echo "Flashing $FIRMWARE to $BOARD..."
cd firmware/$FIRMWARE
west flash -r openocd
