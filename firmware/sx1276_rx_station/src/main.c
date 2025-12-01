#include <zephyr/device.h>
#include <zephyr/drivers/lora.h>
#include <zephyr/kernel.h>
#include <zephyr/sys/printk.h>

#define MAX_DATA_LEN 255

static uint8_t rx_buffer[MAX_DATA_LEN];

// Correct callback signature with user_data pointer
static void rx_callback(const struct device *dev,
                       uint8_t *data, uint16_t size,
                       int16_t rssi, int8_t snr,
                       void *user_data)
{
    printk("\n*** CALLBACK! ***\n");
    printk("Size: %d, RSSI: %d, SNR: %d\n", size, rssi, snr);
    
    if (size > 0 && size < MAX_DATA_LEN) {
        printk("Data: ");
        for (int i = 0; i < size; i++) {
            printk("%02x ", data[i]);
        }
        printk("\nString: \"");
        for (int i = 0; i < size; i++) {
            printk("%c", (data[i] >= 32 && data[i] <= 126) ? data[i] : '.');
        }
        printk("\"\n");
    }
    printk("*****************\n\n");
}

void main(void)
{
    const struct device *dev = DEVICE_DT_GET(DT_ALIAS(lora0));
    int ret;

    printk("\n=== SX1276 RX - Async Mode ===\n");

    if (!device_is_ready(dev)) {
        printk("Device not ready!\n");
        return;
    }

    struct lora_modem_config cfg = {
        .frequency = 868100000,
        .bandwidth = BW_125_KHZ,
        .datarate = SF_7,
        .coding_rate = CR_4_5,
        .preamble_len = 8,
        .tx_power = 14,
        .tx = false,
    };

    ret = lora_config(dev, &cfg);
    printk("Config: %d\n", ret);
    printk("RX: 868.1MHz SF7 BW125 CR4/5\n\n");
    
    // Try async receive with user_data = NULL
    printk("Trying async RX...\n");
    ret = lora_recv_async(dev, rx_callback, NULL);
    if (ret == 0) {
        printk("Async RX started!\n");
        printk("Waiting for packets...\n\n");
        
        // Keep alive
        while (1) {
            k_sleep(K_SECONDS(5));
            printk(".\n");
        }
    } else {
        printk("Async not supported (ret=%d)\n", ret);
        printk("Using blocking mode...\n\n");
        
        // Blocking fallback
        int16_t rssi;
        int8_t snr;
        int len;
        int count = 0;
        
        while (1) {
            len = lora_recv(dev, rx_buffer, MAX_DATA_LEN, K_SECONDS(5), &rssi, &snr);
            
            if (len >= 0) {
                printk("\n*** RX! ***\n");
                printk("Len=%d RSSI=%d SNR=%d\n", len, rssi, snr);
                if (len > 0) {
                    printk("Hex: ");
                    for (int i = 0; i < len; i++) {
                        printk("%02x ", rx_buffer[i]);
                    }
                    printk("\nStr: \"");
                    for (int i = 0; i < len; i++) {
                        printk("%c", (rx_buffer[i] >= 32 && rx_buffer[i] <= 126) ? rx_buffer[i] : '.');
                    }
                    printk("\"\n");
                }
                printk("***********\n\n");
                count = 0;
            } else if (len == -EAGAIN) {
                count++;
                if (count % 20 == 0) {
                    printk("[%d timeouts]\n", count);
                }
            } else {
                printk("Error: %d\n", len);
            }
        }
    }
}
