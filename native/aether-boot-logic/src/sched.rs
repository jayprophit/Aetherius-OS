//! Cooperative round-robin scheduling policy (host-testable pure logic).
//! The machine-level context switch lives in the UEFI crate; this module
//! decides *what* runs next, never *how*.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TaskState {
    Ready,
    Running,
    Finished,
}

#[derive(Debug, Clone, Copy)]
pub struct Task {
    pub id: usize,
    pub state: TaskState,
}

pub struct Scheduler {
    tasks: [Option<Task>; 16],
    count: usize,
    last_pick: Option<usize>,
}

impl Scheduler {
    pub fn new() -> Self {
        Self { tasks: [None; 16], count: 0, last_pick: None }
    }

    pub fn spawn(&mut self) -> Option<usize> {
        if self.count >= self.tasks.len() {
            return None;
        }
        let id = self.count;
        self.tasks[id] = Some(Task { id, state: TaskState::Ready });
        self.count += 1;
        Some(id)
    }

    pub fn finish(&mut self, id: usize) {
        if let Some(task) = self.tasks.get_mut(id).and_then(|slot| slot.as_mut()) {
            task.state = TaskState::Finished;
        }
    }

    pub fn remaining(&self) -> usize {
        self.tasks[..self.count]
            .iter()
            .filter(|task| matches!(task, Some(Task { state: TaskState::Ready | TaskState::Running, .. })))
            .count()
    }

    /// Next READY task after the last pick (round-robin), or None.
    pub fn pick_next(&mut self) -> Option<usize> {
        if self.count == 0 {
            return None;
        }
        for step in 1..=self.count {
            let candidate = ((self.last_pick.unwrap_or(self.count - 1)) + step) % self.count;
            if matches!(
                self.tasks[candidate],
                Some(Task { state: TaskState::Ready, .. })
            ) {
                if let Some(task) = self.tasks[candidate].as_mut() {
                    task.state = TaskState::Running;
                }
                self.last_pick = Some(candidate);
                return Some(candidate);
            }
        }
        None
    }

    /// Mark the previously running task ready again (a yield that is not done).
    pub fn yield_back(&mut self, id: usize) {
        if let Some(task) = self.tasks.get_mut(id).and_then(|slot| slot.as_mut()) {
            if task.state == TaskState::Running {
                task.state = TaskState::Ready;
            }
        }
    }
}

impl Default for Scheduler {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_robins_two_tasks() {
        let mut scheduler = Scheduler::new();
        let a = scheduler.spawn().expect("a");
        let b = scheduler.spawn().expect("b");
        assert_eq!(scheduler.pick_next(), Some(a));
        scheduler.yield_back(a);
        assert_eq!(scheduler.pick_next(), Some(b));
        scheduler.yield_back(b);
        assert_eq!(scheduler.pick_next(), Some(a));
    }

    #[test]
    fn finished_tasks_are_skipped() {
        let mut scheduler = Scheduler::new();
        let a = scheduler.spawn().expect("a");
        let b = scheduler.spawn().expect("b");
        scheduler.finish(a);
        assert_eq!(scheduler.remaining(), 1);
        assert_eq!(scheduler.pick_next(), Some(b));
        scheduler.yield_back(b);
        assert_eq!(scheduler.pick_next(), Some(b));
        scheduler.finish(b);
        assert_eq!(scheduler.remaining(), 0);
        assert_eq!(scheduler.pick_next(), None);
    }

    #[test]
    fn empty_scheduler_picks_nothing() {
        let mut scheduler = Scheduler::new();
        assert_eq!(scheduler.pick_next(), None);
        assert_eq!(scheduler.remaining(), 0);
    }

    #[test]
    fn capacity_is_bounded() {
        let mut scheduler = Scheduler::new();
        for _ in 0..16 {
            assert!(scheduler.spawn().is_some());
        }
        assert_eq!(scheduler.spawn(), None);
    }
}
