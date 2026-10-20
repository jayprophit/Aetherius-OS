/*
 * Aetherius kernel: host tests for the pure logic.
 *
 * These run on the host with an ordinary compiler, with no kernel, no
 * emulator and no firmware. They cover the parts of the kernel that are
 * arithmetic and policy rather than machine instructions:
 *
 *   - GDT, TSS and STAR encoding
 *   - IDT gate encoding
 *   - PIC remap and PIT divisor arithmetic
 *   - round-robin scheduling policy
 *   - syscall dispatch and capability gating
 *
 * The machine-level parts - installing the GDT, taking the interrupt, the
 * context switch - cannot be tested this way and are covered by the QEMU
 * boot harness instead. This file never pretends to cover them.
 *
 * The assertions are deliberately the same ones the Rust original carried,
 * so the port is proven to preserve behaviour rather than merely to
 * compile.
 */

#include <stdio.h>
#include <string.h>

#include "aether/gdt.h"
#include "aether/idt.h"
#include "aether/kernel.h"
#include "aether/sched.h"
#include "aether/syscall.h"

static int g_failures = 0;
static int g_checks = 0;

#define CHECK(cond)                                                            \
    do {                                                                       \
        g_checks++;                                                            \
        if (!(cond)) {                                                         \
            g_failures++;                                                      \
            fprintf(stderr, "FAIL %s:%d  %s\n", __FILE__, __LINE__, #cond);    \
        }                                                                      \
    } while (0)

#define CHECK_EQ_U64(actual, expected)                                         \
    do {                                                                       \
        g_checks++;                                                            \
        uint64_t a_ = (uint64_t)(actual);                                      \
        uint64_t e_ = (uint64_t)(expected);                                    \
        if (a_ != e_) {                                                        \
            g_failures++;                                                      \
            fprintf(stderr, "FAIL %s:%d  %s == %s (0x%llx != 0x%llx)\n",      \
                    __FILE__, __LINE__, #actual, #expected,                     \
                    (unsigned long long)a_, (unsigned long long)e_);            \
        }                                                                      \
    } while (0)

/* -- GDT --------------------------------------------------------------- */

static void test_kernel_code_descriptor(void) {
    CHECK_EQ_U64(aether_segment_descriptor(1, 0), 0x00AF9A000000FFFFull);
}

static void test_kernel_data_descriptor(void) {
    CHECK_EQ_U64(aether_segment_descriptor(0, 0), 0x00CF92000000FFFFull);
}

static void test_user_code_descriptor(void) {
    CHECK_EQ_U64(aether_segment_descriptor(1, 3), 0x00AFFA000000FFFFull);
}

static void test_user_data_descriptor(void) {
    CHECK_EQ_U64(aether_segment_descriptor(0, 3), 0x00CFF2000000FFFFull);
}

static void test_star_routes_syscall_and_sysret(void) {
    uint64_t star = aether_star_value();
    CHECK_EQ_U64((star >> 32) & 0xFFFFu, AETHER_SEL_KCODE);
    uint16_t base = (uint16_t)((star >> 48) & 0xFFFFu);
    CHECK_EQ_U64((uint16_t)(base + 16u), AETHER_SEL_UCODE);
    CHECK_EQ_U64((uint16_t)(base + 8u), AETHER_SEL_UDATA);
}

static void test_tss_descriptor_round_trips_base(void) {
    uint64_t pair[2];
    aether_tss_descriptor(0x1DE25040ull, 103u, pair);
    CHECK_EQ_U64(pair[0] & 0xFFFFu, 103u);
    CHECK_EQ_U64(aether_tss_descriptor_base(pair), 0x1DE25040ull);
    CHECK_EQ_U64((pair[0] >> 40) & 0xFFu, 0x89u);
}

/* -- IDT --------------------------------------------------------------- */

static void test_gate_is_16_bytes(void) {
    CHECK_EQ_U64(sizeof(aether_gate_desc), 16u);
}

static void test_gate_byte_layout_matches_x86(void) {
    aether_gate_desc gate = aether_gate_new(0x1122334455667788ull, 0x08u,
                                            AETHER_GATE_INTERRUPT, 0u, 1);
    const unsigned char *bytes = (const unsigned char *)&gate;
    CHECK_EQ_U64(bytes[0], 0x88u);
    CHECK_EQ_U64(bytes[1], 0x77u);
    CHECK_EQ_U64(bytes[2], 0x08u);
    CHECK_EQ_U64(bytes[3], 0x00u);
    CHECK_EQ_U64(bytes[4], 0x00u);
    CHECK_EQ_U64(bytes[5], 0x8Eu);
    CHECK_EQ_U64(bytes[6], 0x66u);
    CHECK_EQ_U64(bytes[7], 0x55u);
    CHECK_EQ_U64(bytes[8], 0x44u);
    CHECK_EQ_U64(bytes[9], 0x33u);
    CHECK_EQ_U64(bytes[10], 0x22u);
    CHECK_EQ_U64(bytes[11], 0x11u);
    CHECK_EQ_U64(bytes[12], 0x00u);
    CHECK_EQ_U64(bytes[13], 0x00u);
    CHECK_EQ_U64(bytes[14], 0x00u);
    CHECK_EQ_U64(bytes[15], 0x00u);
}

static void test_gate_round_trips_offset(void) {
    aether_gate_desc gate = aether_gate_new(0xFFFF800000101234ull, 0x08u,
                                            AETHER_GATE_INTERRUPT, 0u, 1);
    CHECK_EQ_U64(aether_gate_offset(&gate), 0xFFFF800000101234ull);
    CHECK(aether_gate_is_present(&gate));
    CHECK_EQ_U64(gate.type_attr & 0x0Fu, 0x0Eu);
}

static void test_absent_gate_is_not_present(void) {
    aether_gate_desc gate = aether_gate_new(0u, 0x08u, AETHER_GATE_TRAP, 3u, 0);
    CHECK(!aether_gate_is_present(&gate));
}

static void test_pic_remap_vectors(void) {
    aether_pic_remap remap = {0x20u, 0x28u};
    CHECK_EQ_U64(aether_pic_irq_vector(&remap, 0u), 0x20u);
    CHECK_EQ_U64(aether_pic_irq_vector(&remap, 7u), 0x27u);
    CHECK_EQ_U64(aether_pic_irq_vector(&remap, 8u), 0x28u);
    CHECK_EQ_U64(aether_pic_irq_vector(&remap, 15u), 0x2Fu);
    CHECK_EQ_U64(aether_pic_irq_vector(&remap, 16u), -1);
}

static void test_pit_100hz_divisor(void) {
    int32_t divisor = aether_pit_divisor(100u);
    CHECK(divisor > 0);
    CHECK_EQ_U64((uint32_t)divisor, 11931u);
    uint8_t bytes[2];
    aether_pit_bytes((uint16_t)divisor, bytes);
    CHECK_EQ_U64(bytes[0], 0x9Bu);
    CHECK_EQ_U64(bytes[1], 0x2Eu);
    CHECK_EQ_U64(aether_pit_divisor(0u), -1);
}

static void test_tick_conversion(void) {
    CHECK_EQ_U64(aether_ticks_to_ms(200u, 100u), 2000u);
    CHECK_EQ_U64(aether_ticks_to_ms(1u, 0u), 0u);
}

/* -- Scheduler --------------------------------------------------------- */

static void test_round_robins_two_tasks(void) {
    aether_scheduler scheduler;
    aether_scheduler_init(&scheduler);
    int32_t a = aether_scheduler_spawn(&scheduler);
    int32_t b = aether_scheduler_spawn(&scheduler);
    CHECK(a == 0);
    CHECK(b == 1);
    CHECK_EQ_U64(aether_scheduler_pick_next(&scheduler), (uint64_t)a);
    aether_scheduler_yield_back(&scheduler, (size_t)a);
    CHECK_EQ_U64(aether_scheduler_pick_next(&scheduler), (uint64_t)b);
    aether_scheduler_yield_back(&scheduler, (size_t)b);
    CHECK_EQ_U64(aether_scheduler_pick_next(&scheduler), (uint64_t)a);
}

static void test_finished_tasks_are_skipped(void) {
    aether_scheduler scheduler;
    aether_scheduler_init(&scheduler);
    int32_t a = aether_scheduler_spawn(&scheduler);
    int32_t b = aether_scheduler_spawn(&scheduler);
    aether_scheduler_finish(&scheduler, (size_t)a);
    CHECK_EQ_U64(aether_scheduler_remaining(&scheduler), 1u);
    CHECK_EQ_U64(aether_scheduler_pick_next(&scheduler), (uint64_t)b);
    aether_scheduler_yield_back(&scheduler, (size_t)b);
    CHECK_EQ_U64(aether_scheduler_pick_next(&scheduler), (uint64_t)b);
    aether_scheduler_finish(&scheduler, (size_t)b);
    CHECK_EQ_U64(aether_scheduler_remaining(&scheduler), 0u);
    CHECK_EQ_U64(aether_scheduler_pick_next(&scheduler), -1);
}

static void test_empty_scheduler_picks_nothing(void) {
    aether_scheduler scheduler;
    aether_scheduler_init(&scheduler);
    CHECK_EQ_U64(aether_scheduler_pick_next(&scheduler), -1);
    CHECK_EQ_U64(aether_scheduler_remaining(&scheduler), 0u);
}

static void test_capacity_is_bounded(void) {
    aether_scheduler scheduler;
    aether_scheduler_init(&scheduler);
    for (size_t i = 0; i < AETHER_MAX_TASKS; i++) {
        CHECK(aether_scheduler_spawn(&scheduler) >= 0);
    }
    CHECK_EQ_U64(aether_scheduler_spawn(&scheduler), -1);
}

/* -- Syscall dispatch -------------------------------------------------- */

static int64_t handler_echo(int64_t *args) {
    return args[0] * 2;
}

static int64_t handler_needs_cap(int64_t *args) {
    (void)args;
    if (!aether_syscall_has_capability(AETHER_CAP_FS_WRITE)) {
        return AETHER_EDENIED;
    }
    return 0;
}

static int64_t handler_needs_read(int64_t *args) {
    (void)args;
    if (!aether_syscall_has_capability(AETHER_CAP_FS_READ)) {
        return AETHER_EDENIED;
    }
    return 0;
}

static void test_dispatch_runs_the_handler(void) {
    aether_syscall_register(AETHER_SYS_WRITE, handler_echo);
    int64_t args[6] = {21, 0, 0, 0, 0, 0};
    CHECK_EQ_U64(aether_syscall_dispatch(AETHER_SYS_WRITE, args), 42);
}

static void test_dispatch_refuses_an_unregistered_number(void) {
    int64_t args[6] = {0, 0, 0, 0, 0, 0};
    /* A number above the assigned range is never a valid call. */
    CHECK_EQ_U64(aether_syscall_dispatch((int64_t)AETHER_SYS_MAX + 1, args), AETHER_ENOSYS);
    CHECK_EQ_U64(aether_syscall_dispatch(-1, args), AETHER_ENOSYS);
}

static void test_a_duplicate_registration_is_refused(void) {
    CHECK_EQ_U64(aether_syscall_register(AETHER_SYS_WRITE, handler_echo), -1);
}

static void test_capability_gating_refuses_without_the_grant(void) {
    aether_syscall_set_capabilities(0u);
    aether_syscall_register(AETHER_SYS_MEMORY_MAP, handler_needs_cap);
    aether_syscall_register(AETHER_SYS_MEMORY_UNMAP, handler_needs_read);
    int64_t args[6] = {0, 0, 0, 0, 0, 0};
    CHECK_EQ_U64(aether_syscall_dispatch(AETHER_SYS_MEMORY_MAP, args), AETHER_EDENIED);
    CHECK_EQ_U64(aether_syscall_dispatch(AETHER_SYS_MEMORY_UNMAP, args), AETHER_EDENIED);
}

static void test_capability_gating_allows_with_the_grant(void) {
    /* AETHER_CAP_FS_WRITE is capability 2, so bit 1. */
    aether_syscall_set_capabilities(1ull << 1u);
    int64_t args[6] = {0, 0, 0, 0, 0, 0};
    CHECK_EQ_U64(aether_syscall_dispatch(AETHER_SYS_MEMORY_MAP, args), 0);
    /* The read capability was never granted, so it stays refused. */
    CHECK_EQ_U64(aether_syscall_dispatch(AETHER_SYS_MEMORY_UNMAP, args), AETHER_EDENIED);
}

static void test_the_abi_version_and_max_are_stable(void) {
    CHECK_EQ_U64(AETHER_ABI_VERSION, 1u);
    CHECK_EQ_U64(aether_syscall_max(), AETHER_SYS_MAX);
}

static void test_every_syscall_number_is_unique(void) {
    /* The numbers are the contract. A duplicate would silently shadow a
     * call, so the table is checked rather than trusted. */
    uint32_t seen[AETHER_SYS_MAX + 1u];
    memset(seen, 0, sizeof(seen));
    const uint32_t numbers[] = {
        AETHER_SYS_WRITE, AETHER_SYS_READ, AETHER_SYS_EXIT, AETHER_SYS_YIELD,
        AETHER_SYS_CLOCK_MONOTONIC, AETHER_SYS_THREAD_SELF, AETHER_SYS_MEMORY_MAP,
        AETHER_SYS_MEMORY_UNMAP, AETHER_SYS_CAPABILITY_CHECK,
        AETHER_SYS_CAPABILITY_LIST, AETHER_SYS_MESSAGE_SEND, AETHER_SYS_MESSAGE_RECV,
        AETHER_SYS_WORKSPACE_OPEN, AETHER_SYS_WORKSPACE_READ,
        AETHER_SYS_WORKSPACE_WRITE, AETHER_SYS_WORKSPACE_LIST, AETHER_SYS_KV_GET,
        AETHER_SYS_KV_SET, AETHER_SYS_EVENT_POST, AETHER_SYS_EVENT_WAIT,
    };
    CHECK_EQ_U64(sizeof(numbers) / sizeof(numbers[0]), (size_t)AETHER_SYS_MAX + 1u);
    for (size_t i = 0; i < sizeof(numbers) / sizeof(numbers[0]); i++) {
        CHECK(numbers[i] <= AETHER_SYS_MAX);
        CHECK(seen[numbers[i]] == 0u);
        seen[numbers[i]] = 1u;
    }
}

static void test_structures_carry_their_size(void) {
    /* Every structure that crosses the boundary starts with its own size,
     * so the kernel can reject a caller built against a newer header. */
    aether_memmap_request memmap;
    memset(&memmap, 0, sizeof(memmap));
    memmap.aether_memmap_request_size = (uint32_t)sizeof(memmap);
    memmap.aether_memmap_request_abi_version = AETHER_ABI_VERSION;
    CHECK_EQ_U64(memmap.aether_memmap_request_size, sizeof(aether_memmap_request));

    aether_message_header message;
    memset(&message, 0, sizeof(message));
    message.aether_message_header_size = (uint32_t)sizeof(message);
    message.aether_message_header_abi_version = AETHER_ABI_VERSION;
    CHECK_EQ_U64(message.aether_message_header_size, sizeof(aether_message_header));
    CHECK_EQ_U64(message.aether_message_header_size % 8u, 0u);
}

int main(void) {
    test_kernel_code_descriptor();
    test_kernel_data_descriptor();
    test_user_code_descriptor();
    test_user_data_descriptor();
    test_star_routes_syscall_and_sysret();
    test_tss_descriptor_round_trips_base();

    test_gate_is_16_bytes();
    test_gate_byte_layout_matches_x86();
    test_gate_round_trips_offset();
    test_absent_gate_is_not_present();
    test_pic_remap_vectors();
    test_pit_100hz_divisor();
    test_tick_conversion();

    test_round_robins_two_tasks();
    test_finished_tasks_are_skipped();
    test_empty_scheduler_picks_nothing();
    test_capacity_is_bounded();

    test_dispatch_runs_the_handler();
    test_dispatch_refuses_an_unregistered_number();
    test_a_duplicate_registration_is_refused();
    test_capability_gating_refuses_without_the_grant();
    test_capability_gating_allows_with_the_grant();
    test_the_abi_version_and_max_are_stable();
    test_every_syscall_number_is_unique();
    test_structures_carry_their_size();

    printf("%d checks, %d failures\n", g_checks, g_failures);
    return g_failures == 0 ? 0 : 1;
}
