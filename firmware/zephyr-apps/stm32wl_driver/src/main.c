/*
 * STM32WL LoRa Driver - Main Entry Point
 * SPI test harness and LoRa communication
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/logging/log.h>

#include "lora_driver.h"
#include "spi_test.h"

LOG_MODULE_REGISTER(main, LOG_LEVEL_INF);

int main(void)
{
    int ret;

    LOG_INF("STM32WL LoRa Driver Starting...");
    LOG_INF("Build: %s %s", __DATE__, __TIME__);

    /* Run SPI test harness */
    ret = spi_test_run();
    if (ret < 0) {
        LOG_ERR("SPI test failed: %d", ret);
        return ret;
    }

    /* Initialize LoRa driver */
    ret = lora_driver_init();
    if (ret < 0) {
        LOG_ERR("LoRa driver initialization failed: %d", ret);
        return ret;
    }

    LOG_INF("System initialized successfully");

    /* Main loop */
    while (1) {
        /* Process LoRa tasks */
        lora_driver_process();
        
        k_msleep(1000);
    }

    return 0;
}
