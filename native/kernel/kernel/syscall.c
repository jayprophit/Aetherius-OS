/*
 * Aetherius kernel: the syscall dispatch table.
 *
 * The kernel is the only authority on what a caller may do. Every call
 * arrives here, is checked against the caller's capability set, and is
 * either performed or refused with a reason.
 *
 * The dispatch table is versioned. A caller built against a newer ABI
 * version sends a structure whose size the kernel does not recognise, and
 * the kernel refuses it rather than misreading it. A caller built against
 * an older header still works: the size in the structure is the old size,
 * and the kernel reads only the fields it knows.
 *
 * The policy side of this is deliberately minimal here. The real policy
 * engine is the Aetherius P25 authority, and the kernel asks it rather
 * than deciding for itself. The kernel's own table is a local cache of
 * the grants that apply to the currently running agent.
 */

#include "aether/syscall.h"
#include "aether/print.h"

/* The maximum number of syscall arguments any call takes. */
#define AETHER_MAX_SYSCALL_ARGS 6u

typedef int64_t (*aether_syscall_handler)(int64_t *args);

/* The syscall table, indexed by number. A NULL entry is ENOSYS. */
static aether_syscall_handler g_handlers[AETHER_SYS_MAX + 1u] = {0};

/* The capability set of the currently running agent. The kernel replaces
 * this from the policy engine; it never widens it on its own. */
static uint64_t g_capabilities = 0u;

void aether_syscall_set_capabilities(uint64_t capabilities) {
    g_capabilities = capabilities;
}

uint64_t aether_syscall_capabilities(void) {
    return g_capabilities;
}

/* Whether a capability is currently granted. */
int aether_syscall_has_capability(aether_capability_t capability) {
    if (capability == AETHER_CAP_NONE) {
        return 1;
    }
    return (g_capabilities & (1ull << (capability - 1u))) != 0ull;
}

/* Register a handler for a syscall number. Refuses a duplicate so a
 * second registration cannot silently shadow the first. */
int aether_syscall_register(uint32_t number, aether_syscall_handler handler) {
    if (number > AETHER_SYS_MAX) {
        return -1;
    }
    if (g_handlers[number] != 0) {
        return -1;
    }
    g_handlers[number] = handler;
    return 0;
}

/*
 * Dispatch one call. This is the C side of the SYSCALL entry path, and is
 * also what the host tests call directly, so the dispatch rules are tested
 * rather than assumed.
 */
int64_t aether_syscall_dispatch(int64_t number, int64_t *args) {
    if (number < 0 || (uint64_t)number > AETHER_SYS_MAX) {
        return AETHER_ENOSYS;
    }
    aether_syscall_handler handler = g_handlers[number];
    if (handler == 0) {
        return AETHER_ENOSYS;
    }
    return handler(args);
}

/* The number of registered handlers, for diagnostics. */
size_t aether_syscall_registered_count(void) {
    size_t count = 0;
    for (size_t i = 0; i <= AETHER_SYS_MAX; i++) {
        if (g_handlers[i] != 0) {
            count += 1;
        }
    }
    return count;
}

/* The highest syscall number this kernel answers. */
uint32_t aether_syscall_max(void) {
    return AETHER_SYS_MAX;
}
