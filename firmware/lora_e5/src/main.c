/*
 * LoRa E5 Firmware - TX and RX Testing
 * Based on Zephyr LoRa samples
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/lora.h>
#include <zephyr/sys/printk.h>

#define DEFAULT_RADIO_NODE DT_ALIAS(lora0)
#define LOG_LEVEL CONFIG_LOG_DEFAULT_LEVEL

/* Test configuration */
#define TEST_TX_ENABLED 1
#define TEST_RX_ENABLED 1
#define TX_INTERVAL_MS 5000

/* LoRa configuration */
#define LORA_FREQUENCY 868100000  // EU868 MHz
#define LORA_BANDWIDTH BW_125_KHZ
#define LORA_DATARATE SF_7
#define LORA_TX_POWER 14
#define LORA_CODING_RATE CR_4_5

static const struct device *lora_dev;

static void lora_tx_test(void)
{
    uint8_t tx_data[] = "Hello LoRa!";
    int ret;
    
    printk("TX: Sending %d bytes...\n", sizeof(tx_data));
    
    ret = lora_send(lora_dev, tx_data, sizeof(tx_data));
    if (ret < 0) {
        printk("TX: Send failed: %d\n", ret);
    } else {
        printk("TX: Sent successfully\n");
    }
}

static void lora_rx_test(void)
{
    uint8_t rx_buffer[256];
    int16_t rssi;
    int8_t snr;
    int ret;
    
    printk("RX: Waiting for packets...\n");
    
    ret = lora_recv(lora_dev, rx_buffer, sizeof(rx_buffer), 
                    K_SECONDS(10), &rssi, &snr);
    
    if (ret > 0) {
        printk("RX: Received %d bytes, RSSI=%d, SNR=%d\n", ret, rssi, snr);
        printk("RX: Data: %.*s\n", ret, rx_buffer);
    } else if (ret == 0) {
        printk("RX: Timeout\n");
    } else {
        printk("RX: Error: %d\n", ret);
    }
}

int main(void)
{
    struct lora_modem_config config;
    int ret;

    printk("LoRa E5 Firmware - TX/RX Test\n");

#if DT_NODE_HAS_STATUS(DEFAULT_RADIO_NODE, okay)
    lora_dev = DEVICE_DT_GET(DEFAULT_RADIO_NODE);
#else
    printk("LoRa device not found (QEMU build)\n");
    printk("This firmware is for hardware only\n");
    while (1) {
        k_sleep(K_SECONDS(5));
    }
    return 0;
#endif

    if (!device_is_ready(lora_dev)) {
        printk("LoRa device not ready\n");
        return -1;
    }

    /* Configure LoRa modem */
    config.frequency = LORA_FREQUENCY;
    config.bandwidth = LORA_BANDWIDTH;
    config.datarate = LORA_DATARATE;
    config.preamble_len = 8;
    config.coding_rate = LORA_CODING_RATE;
    config.tx_power = LORA_TX_POWER;
    config.tx = true;

    ret = lora_config(lora_dev, &config);
    if (ret < 0) {
        printk("LoRa config failed: %d\n", ret);
        return ret;
    }

    printk("LoRa configured: freq=%u Hz, SF%d, BW=%d kHz\n",
           config.frequency, config.datarate, 125);

    /* Main loop */
    while (1) {
#if TEST_TX_ENABLED
        lora_tx_test();
        k_sleep(K_MSEC(TX_INTERVAL_MS));
#endif

#if TEST_RX_ENABLED
        lora_rx_test();
#endif
        
        k_sleep(K_SECONDS(1));
    }

    return 0;
}
