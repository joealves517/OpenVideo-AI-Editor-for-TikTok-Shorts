import { Patch } from "@openvideo/core";

export interface PlanStep {
  id: string;
  description: string;
}

export interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
}

export type WsServerMessage =
  | { type: "patch"; patch: Patch }
  | { type: "chat.chunk"; text: string }
  | { type: "plan.created"; plan: Plan }
  | { type: "plan.step"; description: string }
  | { type: "plan.complete"; planId: string }
  | { type: "error"; message: string };

export type WsClientMessage =
  | { type: "chat"; sessionId: string; message: string }
  | { type: "plan.confirm"; planId: string }
  | { type: "plan.reject"; planId: string };
