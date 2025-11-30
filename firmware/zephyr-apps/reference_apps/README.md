# Reference Applications

This directory contains reference Zephyr applications for various STM32 platforms.

## Supported Platforms

- **STM32U5**: Ultra-low-power applications
- **STM32H7**: High-performance dual-core applications
- **STM32F4**: General-purpose reference platform

## Usage

Each subdirectory contains a complete Zephyr application that can be built with:

```bash
west build -b <board_name> <app_directory>
```

Example:
```bash
west build -b nucleo_u575zi_q reference_apps/stm32u5_app
```

## Creating New Reference Apps

1. Copy an existing app directory
2. Modify `CMakeLists.txt` and `prj.conf` as needed
3. Update source files in `src/`
4. Document board-specific requirements

## Notes

- All apps follow standard Zephyr RTOS structure
- Common libraries should be placed in a shared directory
- Test on actual hardware before committing
