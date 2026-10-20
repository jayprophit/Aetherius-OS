/*
 * Aetherius kernel: internal kernel API.
 *
 * This header is for the kernel's own modules. It is not part of the
 * user-space contract; that is aether/syscall.h, and nothing in user
 * space may depend on anything declared here.
 */

#ifndef AETHER_KERNEL_H
#define AETHER_KERNEL_H

#include "aether/types.h"
#include "aether/syscall.h"

/* The handler type for one syscall. Arguments arrive in args[0..5]. */
typedef int64_t (*aether_syscall_handler)(int64_t *args);

/* Register a handler for a syscall number. Returns 0 on success, -1 when
 * the number is out of range or already registered. */
int aether_syscall_register(uint32_t number, aether_syscall_handler handler);

/* Dispatch one call. Returns the call's result, or a negative error. */
int64_t aether_syscall_dispatch(int64_t number, int64_t *args);

/* Replace the capability set of the currently running agent. The kernel
 * never widens its own capability set; the policy engine does that. */
void aether_syscall_set_capabilities(uint64_t capabilities);

/* The capability set of the currently running agent. */
uint64_t aether_syscall_capabilities(void);

/* Whether a capability is currently granted. */
int aether_syscall_has_capability(aether_capability_t capability);

/* How many syscall handlers are registered, for diagnostics. */
size_t aether_syscall_registered_count(void);

/* The highest syscall number this kernel answers. */
uint32_t aether_syscall_max(void);

#endif /* AETHER_KERNEL_H */
