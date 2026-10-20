/*
 * Aetherius kernel: cooperative round-robin scheduling policy.
 *
 * Pure policy. This module decides *what* runs next; the machine-level
 * context switch lives in the kernel proper and is never reached from
 * here. Keeping the two apart is what makes the policy testable on a
 * host with no kernel running.
 */

#ifndef AETHER_SCHED_H
#define AETHER_SCHED_H

#include "aether/types.h"

#define AETHER_MAX_TASKS 16u

typedef enum aether_task_state {
    AETHER_TASK_READY = 0,
    AETHER_TASK_RUNNING = 1,
    AETHER_TASK_FINISHED = 2,
} aether_task_state;

typedef struct aether_task {
    size_t id;
    aether_task_state state;
} aether_task;

typedef struct aether_scheduler {
    int occupied[AETHER_MAX_TASKS];
    aether_task tasks[AETHER_MAX_TASKS];
    size_t count;
    size_t last_pick;
    int has_last_pick;
} aether_scheduler;

/* An empty scheduler. */
void aether_scheduler_init(aether_scheduler *scheduler);

/* Add a task. Returns its id, or -1 when the scheduler is full. */
int32_t aether_scheduler_spawn(aether_scheduler *scheduler);

/* Mark a task finished. */
void aether_scheduler_finish(aether_scheduler *scheduler, size_t id);

/* How many tasks are still ready or running. */
size_t aether_scheduler_remaining(const aether_scheduler *scheduler);

/*
 * The next READY task after the last pick, in round-robin order, marked
 * RUNNING. Returns -1 when nothing is ready.
 */
int32_t aether_scheduler_pick_next(aether_scheduler *scheduler);

/* Mark a running task ready again, for a yield that is not a finish. */
void aether_scheduler_yield_back(aether_scheduler *scheduler, size_t id);

/* The state of a task, for inspection. */
aether_task_state aether_scheduler_state(const aether_scheduler *scheduler, size_t id);

#endif /* AETHER_SCHED_H */
