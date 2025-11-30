/*
 * LoRa Driver Implementation
 * SX126x-based LoRa communication
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/lora.h>
#include <zephyr/logging/log.h>

#include "lora_driver.h"

LOG_MODULE_REGISTER(lora_driver, LOG_LEVEL_DBG);

#define DEFAULT_RADIO_NODE DT_ALIAS(lora0)

static const struct device *lora_dev;
static bool driver_initialized = false;

/* LoRa configuration */
static struct lora_modem_config lora_cfg = {
    .frequency = 915000000,  /* 915 MHz (US band) */
    .bandwidth = BW_125_KHZ,
    .datarate = SF_7,
    .preamble_len = 8,
    .coding_rate = CR_4_5,
    .tx_power = 14,
    .tx = true,
};

int lora_driver_init(void)
{
    int ret;

    LOG_INF("Initializing LoRa driver");

    lora_dev = DEVICE_DT_GET(DEFAULT_RADIO_NODE);
    if (!device_is_ready(lora_dev)) {
        LOG_ERR("LoRa device not ready");
        return -ENODEV;
    }

    ret = lora_config(lora_dev, &lora_cfg);
    if (ret < 0) {
        LOG_ERR("LoRa config failed: %d", ret);
        return ret;
    }

    driver_initialized = true;
    LOG_INF("LoRa driver initialized (freq: %u Hz, SF: %d)", 
            lora_cfg.frequency, lora_cfg.datarate);

    return 0;
}

int lora_driver_send(const uint8_t *data, size_t len)
{
    int ret;

    if (!driver_initialized) {
        LOG_ERR("Driver not initialized");
        return -ENODEV;
    }

    LOG_DBG("Sending %zu bytes", len);

    ret = lora_send(lora_dev, data, len);
    if (ret < 0) {
        LOG_ERR("Send failed: %d", ret);
        return ret;
    }

    LOG_INF("Transmitted %zu bytes", len);
    return 0;
}

int lora_driver_receive(uint8_t *data, size_t max_len, int16_t *rssi, int8_t *snr)
{
    int ret;

    if (!driver_initialized) {
        LOG_ERR("Driver not initialized");
        return -ENODEV;
    }

    ret = lora_recv(lora_dev, data, max_len, K_FOREVER, rssi, snr);
    if (ret < 0) {
        LOG_ERR("Receive failed: %d", ret);
        return ret;
    }

    LOG_INF("Received %d bytes (RSSI: %d, SNR: %d)", ret, *rssi, *snr);
    return ret;
}

void lora_driver_process(void)
{
    static uint32_t msg_count = 0;
    uint8_t test_msg[32];
    int ret;

    if (!driver_initialized) {
        return;
    }

    /* Send periodic test message */
    if (msg_count % 30 == 0) {
        snprintf(test_msg, sizeof(test_msg), "Test message #%u", msg_count);
        ret = lora_driver_send(test_msg, strlen(test_msg));
        if (ret < 0) {
            LOG_ERR("Failed to send test message");
        }
    }

    msg_count++;
}
