#!/bin/bash
PORT=${1:-/dev/ttyUSB0}
BAUD=${2:-115200}

echo "Monitoring $PORT at $BAUD baud..."
screen $PORT $BAUD
