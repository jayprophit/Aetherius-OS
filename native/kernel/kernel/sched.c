/*
 * Aetherius kernel: cooperative round-robin scheduling policy.
 */

#include "aether/sched.h"

void aether_scheduler_init(aether_scheduler *scheduler) {
    for (size_t i = 0; i < AETHER_MAX_TASKS; i++) {
        scheduler->occupied[i] = 0;
        scheduler->tasks[i].id = 0;
        scheduler->tasks[i].state = AETHER_TASK_READY;
    }
    scheduler->count = 0;
    scheduler->last_pick = 0;
    scheduler->has_last_pick = 0;
}

int32_t aether_scheduler_spawn(aether_scheduler *scheduler) {
    if (scheduler->count >= AETHER_MAX_TASKS) {
        return -1;
    }
    size_t id = scheduler->count;
    scheduler->occupied[id] = 1;
    scheduler->tasks[id].id = id;
    scheduler->tasks[id].state = AETHER_TASK_READY;
    scheduler->count += 1;
    return (int32_t)id;
}

void aether_scheduler_finish(aether_scheduler *scheduler, size_t id) {
    if (id >= AETHER_MAX_TASKS || !scheduler->occupied[id]) {
        return;
    }
    scheduler->tasks[id].state = AETHER_TASK_FINISHED;
}

size_t aether_scheduler_remaining(const aether_scheduler *scheduler) {
    size_t count = 0;
    for (size_t i = 0; i < scheduler->count; i++) {
        if (scheduler->occupied[i]
            && (scheduler->tasks[i].state == AETHER_TASK_READY
                || scheduler->tasks[i].state == AETHER_TASK_RUNNING)) {
            count += 1;
        }
    }
    return count;
}

int32_t aether_scheduler_pick_next(aether_scheduler *scheduler) {
    if (scheduler->count == 0) {
        return -1;
    }
    size_t start = scheduler->has_last_pick ? scheduler->last_pick
                                            : (scheduler->count - 1u);
    for (size_t step = 1; step <= scheduler->count; step++) {
        size_t candidate = (start + step) % scheduler->count;
        if (scheduler->occupied[candidate]
            && scheduler->tasks[candidate].state == AETHER_TASK_READY) {
            scheduler->tasks[candidate].state = AETHER_TASK_RUNNING;
            scheduler->last_pick = candidate;
            scheduler->has_last_pick = 1;
            return (int32_t)candidate;
        }
    }
    return -1;
}

void aether_scheduler_yield_back(aether_scheduler *scheduler, size_t id) {
    if (id >= AETHER_MAX_TASKS || !scheduler->occupied[id]) {
        return;
    }
    if (scheduler->tasks[id].state == AETHER_TASK_RUNNING) {
        scheduler->tasks[id].state = AETHER_TASK_READY;
    }
}

aether_task_state aether_scheduler_state(const aether_scheduler *scheduler, size_t id) {
    if (id >= AETHER_MAX_TASKS || !scheduler->occupied[id]) {
        return AETHER_TASK_FINISHED;
    }
    return scheduler->tasks[id].state;
}
