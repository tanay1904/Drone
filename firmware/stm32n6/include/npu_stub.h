/*
 * NPU Stub Interface Header
 */

#ifndef NPU_STUB_H
#define NPU_STUB_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/**
 * @brief Initialize the NPU stub interface
 * @return 0 on success, negative errno on failure
 */
int npu_stub_init(void);

/**
 * @brief Run inference on the NPU
 * @param input_data Pointer to input data buffer
 * @param input_size Size of input data in bytes
 * @param output_data Pointer to output data buffer
 * @param output_size Size of output buffer in bytes
 * @return 0 on success, negative errno on failure
 */
int npu_stub_inference(const uint8_t *input_data, size_t input_size,
                       uint8_t *output_data, size_t output_size);

/**
 * @brief Load a model onto the NPU
 * @param model_name Name of the model to load
 * @return 0 on success, negative errno on failure
 */
int npu_stub_load_model(const char *model_name);

/**
 * @brief Check if NPU is ready
 * @return true if NPU is ready, false otherwise
 */
bool npu_stub_is_ready(void);

#endif /* NPU_STUB_H */
