/*
 * NPU Stub Interface
 * Simulates NPU communication for testing
 */

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/drivers/spi.h>

#include "npu_stub.h"

LOG_MODULE_REGISTER(npu_stub, LOG_LEVEL_DBG);

static bool npu_initialized = false;

int npu_stub_init(void)
{
    LOG_INF("Initializing NPU stub interface");
    
    /* TODO: Initialize SPI communication to NPU */
    
    npu_initialized = true;
    LOG_INF("NPU stub initialized");
    
    return 0;
}

int npu_stub_inference(const uint8_t *input_data, size_t input_size,
                       uint8_t *output_data, size_t output_size)
{
    if (!npu_initialized) {
        LOG_ERR("NPU not initialized");
        return -ENODEV;
    }

    LOG_DBG("Running inference: input_size=%zu, output_size=%zu", 
            input_size, output_size);

    /* TODO: Implement actual NPU communication */
    /* For now, return dummy data */
    if (output_data && output_size > 0) {
        memset(output_data, 0xAA, output_size);
    }

    return 0;
}

int npu_stub_load_model(const char *model_name)
{
    if (!npu_initialized) {
        LOG_ERR("NPU not initialized");
        return -ENODEV;
    }

    LOG_INF("Loading model: %s", model_name);
    
    /* TODO: Implement model loading */
    
    return 0;
}

bool npu_stub_is_ready(void)
{
    return npu_initialized;
}
