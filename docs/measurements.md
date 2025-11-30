# Measurement System

## Log Format

All firmware outputs structured logs:
```
MEAS,function,iter,N,ns,VALUE
CTRL,loop,iter,N,ns,VALUE
STACK,thread,NAME,free_bytes,VALUE
LORA_TX,payload,N,sf,SF,airtime_ms,VALUE
```

## Processing Logs
```bash
# Parse LoRa measurements
./tools/parse_lora_logs.py < uart.log > results.json

# Calculate theoretical airtime
./tools/calculate_lora_airtime.py --payload 500 --sf 9
```

## Measurement Boundaries
```
===MEASUREMENTS_START===
... log lines ...
===MEASUREMENTS_END===
```
