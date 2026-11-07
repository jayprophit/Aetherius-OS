import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Campaign {
  id: string;
  name: string;
  channel: "email" | "social" | "ads";
  status: "draft" | "scheduled" | "sent";
}

export interface CampaignsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class Campaigns {
  private readonly campaigns = new Map<string, Campaign>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: CampaignsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  create(name: string, channel: Campaign["channel"]): Campaign {
    const campaign: Campaign = { id: newId("campaign"), name, channel, status: "draft" };
    this.campaigns.set(campaign.id, campaign);
    this.ledger.append({ type: "campaigns.created", actor: "campaigns", subject: campaign.id });
    return campaign;
  }

  list(): Campaign[] {
    return Array.from(this.campaigns.values());
  }
}
