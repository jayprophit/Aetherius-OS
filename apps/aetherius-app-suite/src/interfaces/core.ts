/** Core interface layer — Aetherius App Suite | Added for gap closure */
import { durableRepo } from "../../../sovereign-financial-os/src/persistence.ts"; // pattern reference
export interface CoreService { getState(): any; persist(): void; }
