import type { mysteries } from "./content/mysteries";
import type { prayer } from "./content/prayers";
export type Mystery = keyof typeof mysteries;
export interface Step {
  key: keyof typeof prayer | "mystery";
  node: string;
  nodeLabel?: string;
  note?: string;
  decade?: number;
  count?: number;
  type?: string;
}
export interface Bead {
  id: string;
  label: string;
  stepIndex: number;
}
export interface Sequence {
  steps: Step[];
  orderedNodes: Bead[];
  nodeToStep: Map<string, number>;
}
export interface AppState {
  mystery: Mystery;
  index: number;
  activeNode: string;
  textVisible: boolean;
}
