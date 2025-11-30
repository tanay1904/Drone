/*
 * Control Subsystem
 * Main control logic and state management
 */

#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>

#include "control.h"
#include "npu_stub.h"

LOG_MODULE_REGISTER(control, LOG_LEVEL_DBG);

static struct {
    bool initialized;
    uint32_t tick_count;
    enum {
        STATE_IDLE,
        STATE_RUNNING,
        STATE_ERROR
    } state;
} control_ctx;

int control_init(void)
{
    LOG_INF("Initializing control subsystem");
    
    control_ctx.initialized = true;
    control_ctx.tick_count = 0;
    control_ctx.state = STATE_IDLE;
    
    LOG_INF("Control subsystem initialized");
    return 0;
}

void control_process(void)
{
    if (!control_ctx.initialized) {
        return;
    }

    control_ctx.tick_count++;

    switch (control_ctx.state) {
    case STATE_IDLE:
        if (npu_stub_is_ready()) {
            control_ctx.state = STATE_RUNNING;
            LOG_INF("Transitioning to RUNNING state");
        }
        break;

    case STATE_RUNNING:
        /* Periodic processing */
        if (control_ctx.tick_count % 10 == 0) {
            LOG_DBG("Control tick: %u", control_ctx.tick_count);
        }
        break;

    case STATE_ERROR:
        LOG_ERR("System in ERROR state");
        break;
    }
}

int control_get_status(void)
{
    return control_ctx.state;
}
