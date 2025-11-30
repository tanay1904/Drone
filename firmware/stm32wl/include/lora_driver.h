/*
 * LoRa Driver Header
 */

#ifndef LORA_DRIVER_H
#define LORA_DRIVER_H

#include <stdint.h>
#include <stddef.h>

/**
 * @brief Initialize the LoRa driver
 * @return 0 on success, negative errno on failure
 */
int lora_driver_init(void);

/**
 * @brief Send data via LoRa
 * @param data Pointer to data buffer
 * @param len Length of data in bytes
 * @return 0 on success, negative errno on failure
 */
int lora_driver_send(const uint8_t *data, size_t len);

/**
 * @brief Receive data via LoRa
 * @param data Pointer to receive buffer
 * @param max_len Maximum length of receive buffer
 * @param rssi Pointer to store RSSI value
 * @param snr Pointer to store SNR value
 * @return Number of bytes received, or negative errno on failure
 */
int lora_driver_receive(uint8_t *data, size_t max_len, int16_t *rssi, int8_t *snr);

/**
 * @brief Process LoRa tasks (call periodically)
 */
void lora_driver_process(void);

#endif /* LORA_DRIVER_H */
