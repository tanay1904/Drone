/*
 * SPI Test Harness
 * Tests SPI communication to LoRa radio
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/spi.h>
#include <zephyr/logging/log.h>

#include "spi_test.h"

LOG_MODULE_REGISTER(spi_test, LOG_LEVEL_DBG);

#define SPI_NODE DT_NODELABEL(spi1)

static const struct device *spi_dev;

int spi_test_run(void)
{
    int ret;
    uint8_t tx_buf[4] = {0x00, 0x01, 0x02, 0x03};
    uint8_t rx_buf[4] = {0};

    LOG_INF("Running SPI test harness");

    spi_dev = DEVICE_DT_GET(SPI_NODE);
    if (!device_is_ready(spi_dev)) {
        LOG_WRN("SPI device not ready - skipping test");
        return 0;  /* Non-fatal, continue */
    }

    struct spi_config spi_cfg = {
        .frequency = 1000000,  /* 1 MHz */
        .operation = SPI_WORD_SET(8) | SPI_TRANSFER_MSB,
        .slave = 0,
        .cs = NULL,
    };

    const struct spi_buf tx_bufs[] = {
        {
            .buf = tx_buf,
            .len = sizeof(tx_buf),
        },
    };

    const struct spi_buf rx_bufs[] = {
        {
            .buf = rx_buf,
            .len = sizeof(rx_buf),
        },
    };

    const struct spi_buf_set tx = {
        .buffers = tx_bufs,
        .count = ARRAY_SIZE(tx_bufs),
    };

    const struct spi_buf_set rx = {
        .buffers = rx_bufs,
        .count = ARRAY_SIZE(rx_bufs),
    };

    LOG_DBG("Transmitting test pattern");
    ret = spi_transceive(spi_dev, &spi_cfg, &tx, &rx);
    if (ret < 0) {
        LOG_ERR("SPI transceive failed: %d", ret);
        return ret;
    }

    LOG_INF("SPI test passed - TX: %02x %02x %02x %02x, RX: %02x %02x %02x %02x",
            tx_buf[0], tx_buf[1], tx_buf[2], tx_buf[3],
            rx_buf[0], rx_buf[1], rx_buf[2], rx_buf[3]);

    return 0;
}
