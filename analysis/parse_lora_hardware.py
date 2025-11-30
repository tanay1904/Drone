#!/usr/bin/env python3
"""Parse LoRa E5 Mini hardware measurements"""

import sys
import json
import statistics
from collections import defaultdict

data = defaultdict(lambda: defaultdict(list))

for line in sys.stdin:
    if 'LORA_TX' in line:
        parts = line.strip().split(',')
        payload = int(parts[2])
        sf = int(parts[4])
        airtime = int(parts[6])
        data[payload][sf].append(airtime)

# Generate results
results = []
for payload in sorted(data.keys()):
    for sf in sorted(data[payload].keys()):
        vals = data[payload][sf]
        if vals:
            results.append({
                'payload': payload,
                'sf': sf,
                'airtime_mean_ms': statistics.mean(vals),
                'airtime_std_ms': statistics.stdev(vals) if len(vals) > 1 else 0,
                'count': len(vals)
            })

print(json.dumps(results, indent=2))
