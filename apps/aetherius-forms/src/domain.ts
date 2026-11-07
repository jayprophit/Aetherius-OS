import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "select";
  required: boolean;
}

export interface FormSchema {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormResponse {
  id: string;
  formId: string;
  values: Record<string, string | number>;
  submittedAt: string;
}

export interface FormsOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class FormsService {
  private readonly schemas = new Map<string, FormSchema>();
  private readonly responses: FormResponse[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: FormsOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createForm(title: string, fields: Omit<FormField, "id">[]): FormSchema {
    const schema: FormSchema = {
      id: newId("form"),
      title,
      fields: fields.map((f) => ({ ...f, id: newId("field") })),
    };
    this.schemas.set(schema.id, schema);
    this.ledger.append({ type: "forms.created", actor: "forms", subject: schema.id });
    return schema;
  }

  submit(formId: string, values: Record<string, string | number>): FormResponse {
    const schema = this.schemas.get(formId);
    if (!schema) throw new Error("form not found");
    const response: FormResponse = {
      id: newId("response"),
      formId,
      values,
      submittedAt: nowIso(this.clock),
    };
    this.responses.push(response);
    this.ledger.append({ type: "forms.submitted", actor: "forms", subject: response.id });
    return response;
  }
}
