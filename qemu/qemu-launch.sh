#!/bin/bash
#
# QEMU Launch Script for Zephyr Applications
# Supports multiple STM32 boards in emulation
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default configuration
BOARD="${BOARD:-qemu_cortex_m3}"
APP_DIR="${APP_DIR:-$PROJECT_ROOT/firmware/zephyr-apps/stm32n6_app}"
BUILD_DIR="${BUILD_DIR:-$APP_DIR/build}"
QEMU_LOG="${QEMU_LOG:-$SCRIPT_DIR/qemu.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -b BOARD        Board name (default: qemu_cortex_m3)
    -a APP_DIR      Application directory
    -d BUILD_DIR    Build directory
    -l QEMU_LOG     QEMU log file
    -h              Show this help message

Environment Variables:
    BOARD           Override default board
    APP_DIR         Override default app directory
    BUILD_DIR       Override default build directory
    QEMU_LOG        Override default log file

Examples:
    $0 -b qemu_cortex_m3
    BOARD=qemu_cortex_m4 $0
    $0 -a ../firmware/zephyr-apps/stm32wl_driver

EOF
}

# Parse command line arguments
while getopts "b:a:d:l:h" opt; do
    case $opt in
        b) BOARD="$OPTARG" ;;
        a) APP_DIR="$OPTARG" ;;
        d) BUILD_DIR="$OPTARG" ;;
        l) QEMU_LOG="$OPTARG" ;;
        h) usage; exit 0 ;;
        *) usage; exit 1 ;;
    esac
done

print_info "QEMU Launch Configuration:"
print_info "  Board:      $BOARD"
print_info "  App Dir:    $APP_DIR"
print_info "  Build Dir:  $BUILD_DIR"
print_info "  Log File:   $QEMU_LOG"
echo

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build directory not found: $BUILD_DIR"
    print_info "Building application first..."
    
    cd "$APP_DIR"
    west build -b "$BOARD" || {
        print_error "Build failed"
        exit 1
    }
fi

# Check if zephyr.elf exists
if [ ! -f "$BUILD_DIR/zephyr/zephyr.elf" ]; then
    print_error "Zephyr ELF not found: $BUILD_DIR/zephyr/zephyr.elf"
    exit 1
fi

print_info "Starting QEMU..."
print_info "Press Ctrl+A then X to exit QEMU"
echo

# Launch QEMU with Zephyr
cd "$BUILD_DIR"
west build -t run 2>&1 | tee "$QEMU_LOG"

print_info "QEMU session ended"
print_info "Log saved to: $QEMU_LOG"
