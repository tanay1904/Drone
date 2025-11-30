/*
 * LoRa E5 Mini - Real Hardware Measurements
 * Logs airtime, RSSI, SNR, packet stats for paper data
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/lora.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/printk.h>

LOG_MODULE_REGISTER(lora_measure, LOG_LEVEL_INF);

#define LORA_NODE DT_ALIAS(lora0)
#define TEST_ITERATIONS 100

static const struct device *lora_dev;

/* Test payloads matching paper scenarios */
static const size_t test_payloads[] = {100, 500, 1000, 2000};
static const uint8_t test_sf[] = {7, 9, 12};

/* Measurement logging */
static void log_tx_measurement(size_t payload, uint8_t sf, uint32_t airtime_ms)
{
    printk("LORA_TX,payload,%zu,sf,%u,airtime_ms,%u\n", payload, sf, airtime_ms);
}

static void log_rx_measurement(size_t payload, int16_t rssi, int8_t snr)
{
    printk("LORA_RX,payload,%zu,rssi,%d,snr,%d\n", payload, rssi, snr);
}

/* Configure LoRa parameters */
static int configure_lora(uint8_t sf, uint32_t freq)
{
    struct lora_modem_config cfg = {
        .frequency = freq,
        .bandwidth = BW_125_KHZ,
        .datarate = sf,
        .preamble_len = 8,
        .coding_rate = CR_4_5,
        .tx_power = 14,
        .tx = true,
    };
    
    return lora_config(lora_dev, &cfg);
}

/* Transmit test */
static void test_transmit(size_t payload_size, uint8_t sf)
{
    uint8_t buffer[2048];
    uint32_t start, end, airtime_ms;
    int ret;
    
    /* Fill test payload */
    for (size_t i = 0; i < payload_size; i++) {
        buffer[i] = (uint8_t)(i & 0xFF);
    }
    
    /* Configure */
    configure_lora(sf, 915000000);
    
    /* Measure airtime */
    start = k_uptime_get_32();
    ret = lora_send(lora_dev, buffer, payload_size);
    end = k_uptime_get_32();
    
    if (ret < 0) {
        LOG_ERR("TX failed: %d", ret);
        return;
    }
    
    airtime_ms = end - start;
    log_tx_measurement(payload_size, sf, airtime_ms);
}

/* Receive test */
static void test_receive(size_t expected_size)
{
    uint8_t buffer[2048];
    int16_t rssi;
    int8_t snr;
    int ret;
    
    ret = lora_recv(lora_dev, buffer, sizeof(buffer), K_SECONDS(10), &rssi, &snr);
    
    if (ret > 0) {
        log_rx_measurement(ret, rssi, snr);
    }
}

/* Run measurement suite */
static void run_measurements(void)
{
    LOG_INF("Starting LoRa measurements");
    printk("===LORA_MEASUREMENTS_START===\n");
    
    for (int iter = 0; iter < TEST_ITERATIONS; iter++) {
        for (int p = 0; p < ARRAY_SIZE(test_payloads); p++) {
            for (int s = 0; s < ARRAY_SIZE(test_sf); s++) {
                test_transmit(test_payloads[p], test_sf[s]);
                k_msleep(1000); /* Duty cycle */
            }
        }
    }
    
    printk("===LORA_MEASUREMENTS_END===\n");
    LOG_INF("Measurements complete");
}

int main(void)
{
    int ret;

    LOG_INF("LoRa E5 Mini - Hardware Measurements");
    
    lora_dev = DEVICE_DT_GET(LORA_NODE);
    if (!device_is_ready(lora_dev)) {
        LOG_ERR("LoRa device not ready");
        return -ENODEV;
    }

    run_measurements();

    while (1) {
        k_msleep(1000);
    }

    return 0;
}
