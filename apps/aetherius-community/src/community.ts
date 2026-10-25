import {
  EventLedger,
  NotificationService,
  newId,
  nowIso,
  slugify,
  type Account,
  type Repository,
} from "../../app-kit/src/index.ts";

export interface Group {
  id: string;
  slug: string;
  name: string;
  description: string;
  ownerId: string;
  visibility: "public" | "private";
  createdAt: string;
}

export interface Membership {
  id: string;
  groupId: string;
  accountId: string;
  role: "member" | "moderator";
  status: "active" | "invited";
  joinedAt: string;
}

export interface Post {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  body: string;
  tags: string[];
  status: "visible" | "hidden" | "removed";
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  status: "visible" | "hidden";
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  groupId: string;
  title: string;
  startsAt: string;
  capacity: number | null;
  attendees: string[];
  createdBy: string;
}

export interface Report {
  id: string;
  subjectType: "post" | "comment";
  subjectId: string;
  reporterId: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  resolution: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface CommunityOptions {
  ledger?: EventLedger;
  notifications?: NotificationService;
  clock?: () => Date;
}

function requireActive(account: Account): void {
  if (account.status !== "active") throw new Error("account is not active");
}

/**
 * Community: groups, a feed, comments, events and moderation.
 *
 * Group membership is the permission boundary. A private group is invisible
 * to a non-member, a post in a group requires active membership, and a
 * moderation decision is recorded with the moderator who made it.
 */
export class CommunityService {
  private readonly groups: Repository<Group>;
  private readonly memberships: Repository<Membership>;
  private readonly posts: Repository<Post>;
  private readonly comments: Repository<Comment>;
  private readonly events: Repository<CommunityEvent>;
  private readonly reports: Repository<Report>;
  private readonly options: CommunityOptions;
  private readonly clock: () => Date;

  constructor(
    repos: {
      groups: Repository<Group>;
      memberships: Repository<Membership>;
      posts: Repository<Post>;
      comments: Repository<Comment>;
      events: Repository<CommunityEvent>;
      reports: Repository<Report>;
    },
    options: CommunityOptions = {},
  ) {
    this.groups = repos.groups;
    this.memberships = repos.memberships;
    this.posts = repos.posts;
    this.comments = repos.comments;
    this.events = repos.events;
    this.reports = repos.reports;
    this.options = options;
    this.clock = options.clock ?? (() => new Date());
  }

  createGroup(actor: Account, input: {
    name: string;
    description?: string;
    visibility?: "public" | "private";
  }): Group {
    requireActive(actor);
    if (!input.name?.trim()) throw new Error("a group needs a name");
    const slug = this.uniqueGroupSlug(input.name);
    const group: Group = {
      id: newId("grp"),
      slug,
      name: input.name.trim(),
      description: input.description ?? "",
      ownerId: actor.id,
      visibility: input.visibility ?? "public",
      createdAt: nowIso(this.clock),
    };
    this.groups.put(group);
    this.memberships.put({
      id: newId("mem"),
      groupId: group.id,
      accountId: actor.id,
      role: "moderator",
      status: "active",
      joinedAt: group.createdAt,
    });
    this.record("community.group_created", actor.id, group.id, { slug, visibility: group.visibility });
    return structuredClone(group);
  }

  getGroup(groupId: string, viewer?: Account): Group {
    const group = this.groups.get(groupId);
    if (!group) throw new Error(`no group: ${groupId}`);
    if (group.visibility === "private" && (!viewer || !this.membership(group.id, viewer.id))) {
      throw new Error("this group is private");
    }
    return structuredClone(group);
  }

  joinGroup(actor: Account, groupId: string): Membership {
    requireActive(actor);
    const group = this.groups.get(groupId);
    if (!group) throw new Error(`no group: ${groupId}`);
    const existing = this.membership(groupId, actor.id);
    if (existing?.status === "active") return structuredClone(existing);
    if (group.visibility === "private" && existing?.status !== "invited") {
      throw new Error("this private group requires an invitation");
    }
    const membership: Membership = {
      id: existing?.id ?? newId("mem"),
      groupId,
      accountId: actor.id,
      role: existing?.role ?? "member",
      status: "active",
      joinedAt: nowIso(this.clock),
    };
    this.memberships.put(membership);
    this.record("community.group_joined", actor.id, groupId, {});
    return structuredClone(membership);
  }

  invite(actor: Account, groupId: string, accountId: string): Membership {
    const group = this.requireGroup(groupId);
    this.requireModerator(actor, group);
    if (this.membership(groupId, accountId)?.status === "active") throw new Error("the account is already a member");
    const membership: Membership = {
      id: newId("mem"),
      groupId,
      accountId,
      role: "member",
      status: "invited",
      joinedAt: nowIso(this.clock),
    };
    this.memberships.put(membership);
    this.options.notifications?.notify(accountId, "Group invitation", `You were invited to ${group.name}.`, {
      kind: "community",
      data: { groupId },
    });
    this.record("community.member_invited", actor.id, groupId, { accountId });
    return structuredClone(membership);
  }

  createPost(actor: Account, groupId: string, input: {
    title?: string;
    body: string;
    tags?: string[];
  }): Post {
    const group = this.requireGroup(groupId);
    this.requireMember(actor, group);
    if (!input.body?.trim()) throw new Error("a post needs a body");
    const post: Post = {
      id: newId("pst"),
      groupId,
      authorId: actor.id,
      title: input.title?.trim() ?? "",
      body: input.body.trim(),
      tags: [...new Set((input.tags ?? []).map((tag) => tag.toLowerCase().trim()).filter(Boolean))],
      status: "visible",
      createdAt: nowIso(this.clock),
    };
    this.posts.put(post);
    this.record("community.post_created", actor.id, post.id, { groupId });
    return structuredClone(post);
  }

  comment(actor: Account, postId: string, body: string): Comment {
    const post = this.requirePost(postId);
    if (post.status !== "visible") throw new Error("this post is not open for comment");
    const group = this.requireGroup(post.groupId);
    this.requireMember(actor, group);
    if (!body.trim()) throw new Error("a comment cannot be empty");
    const comment: Comment = {
      id: newId("cmt"),
      postId,
      authorId: actor.id,
      body: body.trim(),
      status: "visible",
      createdAt: nowIso(this.clock),
    };
    this.comments.put(comment);
    if (post.authorId !== actor.id) {
      this.options.notifications?.notify(post.authorId, "New comment", `${actor.displayName} commented on your post.`, {
        kind: "community",
        data: { postId, commentId: comment.id },
      });
    }
    this.record("community.comment_created", actor.id, comment.id, { postId });
    return structuredClone(comment);
  }

  feed(actor: Account, options: { groupId?: string; limit?: number } = {}): Post[] {
    const groups = new Map(
      this.groups
        .all()
        .map((group) => [group.id, group]),
    );
    const visibleGroupIds = new Set(
      this.memberships
        .all()
        .filter((membership) => membership.accountId === actor.id && membership.status === "active")
        .map((membership) => membership.groupId),
    );
    for (const group of groups.values()) {
      if (group.visibility === "public") visibleGroupIds.add(group.id);
    }
    return this.posts
      .all()
      .filter((post) => post.status === "visible")
      .filter((post) => options.groupId === undefined || post.groupId === options.groupId)
      .filter((post) => visibleGroupIds.has(post.groupId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
      .slice(0, options.limit ?? 50)
      .map((post) => structuredClone(post));
  }

  postComments(postId: string): Comment[] {
    return this.comments
      .all()
      .filter((comment) => comment.postId === postId && (comment.status === "visible" || comment.status === "hidden"))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((comment) => structuredClone(comment));
  }

  createEvent(actor: Account, groupId: string, input: {
    title: string;
    startsAt: string;
    capacity?: number | null;
  }): CommunityEvent {
    const group = this.requireGroup(groupId);
    this.requireMember(actor, group);
    if (!input.title?.trim()) throw new Error("an event needs a title");
    if (Number.isNaN(Date.parse(input.startsAt))) throw new Error(`invalid start time: ${input.startsAt}`);
    const capacity = input.capacity ?? null;
    if (capacity !== null && (!Number.isSafeInteger(capacity) || capacity <= 0)) {
      throw new Error("capacity must be a positive integer or null");
    }
    const event: CommunityEvent = {
      id: newId("evt"),
      groupId,
      title: input.title.trim(),
      startsAt: input.startsAt,
      capacity,
      attendees: [],
      createdBy: actor.id,
    };
    this.events.put(event);
    this.record("community.event_created", actor.id, event.id, { groupId });
    return structuredClone(event);
  }

  rsvp(actor: Account, eventId: string): CommunityEvent {
    const event = this.events.get(eventId);
    if (!event) throw new Error(`no event: ${eventId}`);
    this.requireMember(actor, this.requireGroup(event.groupId));
    if (event.attendees.includes(actor.id)) return structuredClone(event);
    if (event.capacity !== null && event.attendees.length >= event.capacity) {
      throw new Error("the event is full");
    }
    event.attendees.push(actor.id);
    this.events.put(event);
    this.record("community.rsvp", actor.id, eventId, {});
    return structuredClone(event);
  }

  report(actor: Account, input: {
    subjectType: "post" | "comment";
    subjectId: string;
    reason: string;
  }): Report {
    requireActive(actor);
    if (!input.reason.trim()) throw new Error("a report needs a reason");
    if (input.subjectType === "post") this.requirePost(input.subjectId);
    else if (!this.comments.get(input.subjectId)) throw new Error(`no comment: ${input.subjectId}`);
    const report: Report = {
      id: newId("rpt"),
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      reporterId: actor.id,
      reason: input.reason.trim(),
      status: "open",
      resolution: "",
      resolvedBy: null,
      resolvedAt: null,
      createdAt: nowIso(this.clock),
    };
    this.reports.put(report);
    this.record("community.report_filed", actor.id, report.id, {
      subjectType: report.subjectType,
      subjectId: report.subjectId,
    });
    return structuredClone(report);
  }

  resolveReport(actor: Account, reportId: string, action: "hide" | "dismiss", note: string): Report {
    const report = this.reports.get(reportId);
    if (!report) throw new Error(`no report: ${reportId}`);
    if (!note.trim()) throw new Error("a moderation decision needs a note");
    const subject =
      report.subjectType === "post" ? this.posts.get(report.subjectId) : this.comments.get(report.subjectId);
    if (!subject) throw new Error("the reported content no longer exists");
    const groupId = report.subjectType === "post" ? (subject as Post).groupId : this.requirePost((subject as Comment).postId).groupId;
    const group = this.requireGroup(groupId);
    this.requireModerator(actor, group);

    if (action === "hide") {
      subject.status = "hidden";
      if (report.subjectType === "post") this.posts.put(subject as Post);
      else this.comments.put(subject as Comment);
      report.status = "resolved";
      const authorId = report.subjectType === "post" ? (subject as Post).authorId : (subject as Comment).authorId;
      this.options.notifications?.notify(authorId, "Content hidden", `A moderator hid your ${report.subjectType}.`, {
        kind: "moderation",
        data: { reportId, note },
      });
    } else {
      report.status = "dismissed";
    }
    report.resolution = note.trim();
    report.resolvedBy = actor.id;
    report.resolvedAt = nowIso(this.clock);
    this.reports.put(report);
    this.record("community.report_resolved", actor.id, reportId, { action, note: note.trim() });
    return structuredClone(report);
  }

  openReports(actor: Account): Report[] {
    const moderated = new Set(
      this.memberships
        .all()
        .filter((membership) => membership.accountId === actor.id && membership.role === "moderator")
        .map((membership) => membership.groupId),
    );
    return this.reports
      .all()
      .filter((report) => report.status === "open")
      .filter((report) => {
        if (report.subjectType === "post") {
          const post = this.posts.get(report.subjectId);
          return post ? moderated.has(post.groupId) : false;
        }
        const comment = this.comments.get(report.subjectId);
        const post = comment ? this.posts.get(comment.postId) : undefined;
        return post ? moderated.has(post.groupId) : false;
      })
      .map((report) => structuredClone(report));
  }

  private requireGroup(groupId: string): Group {
    const group = this.groups.get(groupId);
    if (!group) throw new Error(`no group: ${groupId}`);
    return structuredClone(group);
  }

  private requirePost(postId: string): Post {
    const post = this.posts.get(postId);
    if (!post) throw new Error(`no post: ${postId}`);
    return structuredClone(post);
  }

  private membership(groupId: string, accountId: string): Membership | undefined {
    const membership = this.memberships
      .all()
      .find((candidate) => candidate.groupId === groupId && candidate.accountId === accountId);
    return membership ? structuredClone(membership) : undefined;
  }

  private requireMember(actor: Account, group: Group): Membership {
    requireActive(actor);
    const membership = this.membership(group.id, actor.id);
    if (!membership || membership.status !== "active") throw new Error("join the group before posting");
    return membership;
  }

  private requireModerator(actor: Account, group: Group): Membership {
    requireActive(actor);
    if (actor.roles.includes("admin")) {
      const membership = this.membership(group.id, actor.id);
      return membership ?? {
        id: "admin-override",
        groupId: group.id,
        accountId: actor.id,
        role: "moderator",
        status: "active",
        joinedAt: nowIso(this.clock),
      };
    }
    const membership = this.requireMember(actor, group);
    if (membership.role !== "moderator") throw new Error("this action requires a group moderator");
    return membership;
  }

  private uniqueGroupSlug(name: string): string {
    const base = slugify(name) || "group";
    let candidate = base;
    let suffix = 2;
    while (this.groups.all().some((group) => group.slug === candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private record(type: string, actor: string, subject: string, data: Record<string, unknown>): void {
    this.options.ledger?.append({ type, actor, subject, data });
  }
}
