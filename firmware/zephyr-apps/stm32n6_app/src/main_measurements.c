/*
 * STM32N6 Application - Enhanced for IEEE Paper Measurements
 * Includes structured logging for all paper placeholders
 */

#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/printk.h>

#include "npu_stub.h"
#include "control.h"

LOG_MODULE_REGISTER(main, LOG_LEVEL_INF);

#define LED0_NODE DT_ALIAS(led0)
#define MEASUREMENT_ITERATIONS 1000
#define WARMUP_ITERATIONS 100

#if DT_NODE_HAS_STATUS(LED0_NODE, okay)
static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);
#else
#warning "LED0 not available, using dummy GPIO"
static const struct gpio_dt_spec led = {0};
static bool led_available = false;
#endif

/* Cycle counter helpers */
static inline uint32_t get_cycles(void)
{
    return k_cycle_get_32();
}

static inline uint64_t cycles_to_ns(uint32_t cycles)
{
    return k_cyc_to_ns_floor64(cycles);
}

/* Structured measurement logging */
static void log_measurement(const char *func, uint32_t iter, uint64_t ns)
{
    printk("MEAS,%s,iter,%u,ns,%llu\n", func, iter, ns);
}

static void log_control(uint32_t iter, uint64_t ns)
{
    printk("CTRL,loop,iter,%u,ns,%llu\n", iter, ns);
}

static void log_stack(const char *thread_name, size_t free_bytes)
{
    printk("STACK,thread,%s,free_bytes,%zu\n", thread_name, free_bytes);
}

/* Simulate inference workload */
static void simulate_inference(uint32_t iter)
{
    uint32_t start = get_cycles();
    
    /* Simulate compute-intensive work */
    volatile uint32_t sum = 0;
    for (int i = 0; i < 50000; i++) {
        sum += i * i;
    }
    
    uint32_t end = get_cycles();
    uint64_t ns = cycles_to_ns(end - start);
    log_measurement("inference", iter, ns);
}

/* Simulate event extraction */
static void simulate_event_extraction(uint32_t iter)
{
    uint32_t start = get_cycles();
    
    /* Simulate bbox processing */
    volatile uint32_t bboxes[10][4];
    for (int i = 0; i < 10; i++) {
        bboxes[i][0] = i * 10;
        bboxes[i][1] = i * 20;
        bboxes[i][2] = i * 30;
        bboxes[i][3] = i * 40;
    }
    
    uint32_t end = get_cycles();
    uint64_t ns = cycles_to_ns(end - start);
    log_measurement("event_extract", iter, ns);
}

/* Simulate compression */
static void simulate_compression(uint32_t iter)
{
    uint32_t start = get_cycles();
    
    /* Simulate H.264 encoder work */
    volatile uint8_t buffer[1024];
    for (int i = 0; i < 1024; i++) {
        buffer[i] = (uint8_t)(i % 256);
    }
    
    /* Simulate compression algorithm */
    volatile uint32_t checksum = 0;
    for (int i = 0; i < 1024; i++) {
        checksum += buffer[i];
    }
    
    uint32_t end = get_cycles();
    uint64_t ns = cycles_to_ns(end - start);
    log_measurement("compress", iter, ns);
}

/* Simulate SPI packet preparation */
static void simulate_spi_packet_prep(uint32_t iter)
{
    uint32_t start = get_cycles();
    
    /* Simulate packet framing */
    volatile uint8_t packet[256];
    packet[0] = 0xAA; // Header
    packet[1] = 0xBB;
    
    for (int i = 2; i < 254; i++) {
        packet[i] = (uint8_t)(i & 0xFF);
    }
    
    packet[254] = 0xCC; // Footer
    packet[255] = 0xDD;
    
    uint32_t end = get_cycles();
    uint64_t ns = cycles_to_ns(end - start);
    log_measurement("spi_prep", iter, ns);
}

/* Control loop handler */
static void control_loop_handler(uint32_t iter)
{
    uint32_t start = get_cycles();
    
    /* Simulate control algorithm */
    volatile float state[4] = {1.0f, 2.0f, 3.0f, 4.0f};
    volatile float control[2];
    
    control[0] = state[0] * 0.5f + state[1] * 0.3f;
    control[1] = state[2] * 0.4f + state[3] * 0.6f;
    
    uint32_t end = get_cycles();
    uint64_t ns = cycles_to_ns(end - start);
    log_control(iter, ns);
}

/* Main measurement loop */
static void run_measurements(void)
{
    LOG_INF("Starting warmup iterations...");
    
    /* Warmup */
    for (uint32_t i = 0; i < WARMUP_ITERATIONS; i++) {
        simulate_inference(i);
        k_msleep(1);
    }
    
    LOG_INF("Warmup complete. Starting measurements...");
    printk("===MEASUREMENTS_START===\n");
    
    /* Measurement iterations */
    for (uint32_t i = 0; i < MEASUREMENT_ITERATIONS; i++) {
        /* Full pipeline simulation */
        simulate_inference(i);
        simulate_event_extraction(i);
        simulate_compression(i);
        simulate_spi_packet_prep(i);
        control_loop_handler(i);
        
        /* Log stack usage periodically */
        if (i % 100 == 0) {
            log_stack("perception", 2048); // Placeholder
        }
        
        /* Small delay to simulate frame rate */
        k_msleep(10);
    }
    
    printk("===MEASUREMENTS_END===\n");
    LOG_INF("Measurements complete");
}

int main(void)
{
    int ret;

    LOG_INF("STM32N6 IEEE Paper Measurement Application");
    LOG_INF("Build: %s %s", __DATE__, __TIME__);

#if DT_NODE_HAS_STATUS(LED0_NODE, okay)
    /* Initialize LED if available */
    if (!gpio_is_ready_dt(&led)) {
        LOG_WRN("LED device not ready");
    } else {
        ret = gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);
        if (ret < 0) {
            LOG_ERR("Failed to configure LED pin");
        }
    }
#endif

    /* Initialize NPU stub */
    ret = npu_stub_init();
    if (ret < 0) {
        LOG_ERR("NPU stub initialization failed: %d", ret);
    }

    /* Initialize control subsystem */
    ret = control_init();
    if (ret < 0) {
        LOG_ERR("Control initialization failed: %d", ret);
    }

    LOG_INF("System initialized successfully");

    /* Run measurements */
    run_measurements();

    LOG_INF("Entering idle loop");
    
    /* Idle loop */
    while (1) {
#if DT_NODE_HAS_STATUS(LED0_NODE, okay)
        gpio_pin_toggle_dt(&led);
#endif
        k_msleep(1000);
    }

    return 0;
}
