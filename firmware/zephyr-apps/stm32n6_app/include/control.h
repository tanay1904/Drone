/*
 * Control Subsystem Header
 */

#ifndef CONTROL_H
#define CONTROL_H

/**
 * @brief Initialize the control subsystem
 * @return 0 on success, negative errno on failure
 */
int control_init(void);

/**
 * @brief Process control tasks (call periodically)
 */
void control_process(void);

/**
 * @brief Get current control status
 * @return Current state code
 */
int control_get_status(void);

#endif /* CONTROL_H */
