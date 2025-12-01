#include <zephyr/device.h>
#include <zephyr/drivers/lora.h>
#include <zephyr/kernel.h>
#include <zephyr/sys/printk.h>

#define LORA_NODE DT_ALIAS(lora0)

void main(void)
{
    const struct device *lora_dev = DEVICE_DT_GET(LORA_NODE);
    int ret;

    printk("\n=== LoRa E5 TX Test ===\n");

    if (!device_is_ready(lora_dev)) {
        printk("Device not ready\n");
        return;
    }

    struct lora_modem_config config = {
        .frequency = 868100000,
        .bandwidth = BW_125_KHZ,
        .datarate = SF_7,
        .coding_rate = CR_4_5,
        .preamble_len = 8,
        .tx_power = 14,
        .tx = true,
    };

    ret = lora_config(lora_dev, &config);
    printk("Config: %d\n", ret);
    printk("TX: 868.1MHz SF7 BW125 CR4/5 14dBm\n\n");

    uint8_t tx_data[] = "HELLO";
    int count = 0;
    
    while (1) {
        count++;
        printk("[%d] Sending 5 bytes...", count);
        ret = lora_send(lora_dev, tx_data, sizeof(tx_data));
        printk(" ret=%d %s\n", ret, (ret < 0) ? "FAIL" : "OK");
        
        k_sleep(K_SECONDS(3));
    }
}
