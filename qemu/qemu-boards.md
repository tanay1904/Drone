# QEMU Board Support

This document lists supported QEMU boards for Zephyr application testing.

## Supported QEMU Boards

### ARM Cortex-M

#### qemu_cortex_m3
- **CPU**: ARM Cortex-M3
- **Memory**: 128KB Flash, 16KB RAM
- **Use Case**: Basic embedded testing
- **Command**: `west build -b qemu_cortex_m3`

#### qemu_cortex_m4
- **CPU**: ARM Cortex-M4 with FPU
- **Memory**: Variable
- **Use Case**: Testing with floating-point support
- **Command**: `west build -b qemu_cortex_m4`

#### mps2_an385
- **CPU**: ARM Cortex-M3 (ARM MPS2 platform)
- **Memory**: Configurable
- **Use Case**: Advanced peripheral testing
- **Command**: `west build -b mps2_an385`

#### mps2_an521
- **CPU**: ARM Cortex-M33 with TrustZone
- **Memory**: Configurable
- **Use Case**: Security feature testing
- **Command**: `west build -b mps2_an521`

## Limitations

### Current QEMU Limitations
1. **No STM32N6 support**: STM32N6 NPU cannot be emulated in QEMU
2. **Limited peripherals**: Many STM32-specific peripherals are not available
3. **No radio support**: LoRa/LoRaWAN cannot be tested in QEMU

### Workarounds
- Use QEMU for basic firmware logic testing
- Mock hardware interfaces for functional testing
- Use Renode for more advanced peripheral emulation
- Deploy to real hardware for full validation

## Usage Examples

### Basic Test Run
```bash
./qemu-launch.sh -b qemu_cortex_m3
```

### Custom Application
```bash
./qemu-launch.sh -b qemu_cortex_m4 -a ../firmware/zephyr-apps/stm32wl_driver
```

### With Custom Build Directory
```bash
./qemu-launch.sh -b qemu_cortex_m3 -d /tmp/my-build
```

## Debugging in QEMU

### Enable GDB Server
```bash
west build -b qemu_cortex_m3
west build -t debugserver
```

### Connect GDB
In another terminal:
```bash
arm-none-eabi-gdb build/zephyr/zephyr.elf
(gdb) target remote :1234
(gdb) continue
```

## Alternative: Renode

For better peripheral support, consider using Renode:

```bash
# Install Renode
# See: https://renode.io/

# Create Renode script (.resc)
# Run simulation
renode your-script.resc
```

Renode provides better support for:
- STM32 peripherals (SPI, I2C, UART, etc.)
- Custom peripheral models
- Multi-node network simulation
- Time synchronization

## References

- [Zephyr QEMU Documentation](https://docs.zephyrproject.org/latest/boards/arm/qemu_cortex_m3/doc/index.html)
- [QEMU ARM System Emulation](https://www.qemu.org/docs/master/system/target-arm.html)
- [Renode Documentation](https://renode.readthedocs.io/)
