/*
 * STM32N6 Application - Main Entry Point
 * Control firmware with NPU stub interface
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/logging/log.h>

#include "npu_stub.h"
#include "control.h"

LOG_MODULE_REGISTER(main, LOG_LEVEL_INF);

#define LED0_NODE DT_ALIAS(led0)

#if DT_NODE_HAS_STATUS(LED0_NODE, okay)
static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);
#else
#error "Unsupported board: led0 devicetree alias is not defined"
#endif

int main(void)
{
    int ret;

    LOG_INF("STM32N6 Application Starting...");
    LOG_INF("Build: %s %s", __DATE__, __TIME__);

    /* Initialize LED */
    if (!gpio_is_ready_dt(&led)) {
        LOG_ERR("LED device not ready");
        return -ENODEV;
    }

    ret = gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);
    if (ret < 0) {
        LOG_ERR("Failed to configure LED pin");
        return ret;
    }

    /* Initialize NPU stub */
    ret = npu_stub_init();
    if (ret < 0) {
        LOG_ERR("NPU stub initialization failed: %d", ret);
        return ret;
    }

    /* Initialize control subsystem */
    ret = control_init();
    if (ret < 0) {
        LOG_ERR("Control initialization failed: %d", ret);
        return ret;
    }

    LOG_INF("System initialized successfully");

    /* Main loop */
    while (1) {
        gpio_pin_toggle_dt(&led);
        
        /* Process control tasks */
        control_process();
        
        k_msleep(1000);
    }

    return 0;
}
