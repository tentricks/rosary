import type { Step, Bead, Sequence, Mystery } from "./types";
export const dayMystery: Mystery[] = [
  "glorious",
  "joyful",
  "sorrowful",
  "glorious",
  "luminous",
  "sorrowful",
  "joyful",
];
export function defaultMystery(date = new Date()): Mystery {
  return dayMystery[date.getDay()];
}
// Several prayers share a bead. Bead clicks always target its first prayer.
export function buildSequence(): Sequence {
  const steps: Step[] = [];
  const nodeToStep = new Map<string, number>();
  const orderedNodes: Bead[] = [];
  function addStep(data: Omit<Step, "node">, node: string) {
    const i = steps.length;
    steps.push({
      ...data,
      node,
    });
    if (!nodeToStep.has(node)) {
      nodeToStep.set(node, i);
      orderedNodes.push({
        id: node,
        label: data.nodeLabel || node,
        stepIndex: i,
      });
    }
    return i;
  }
  addStep(
    {
      key: "sign",
      nodeLabel: "cross",
    },
    "cross",
  );
  addStep(
    {
      key: "creed",
    },
    "cross",
  );
  addStep(
    {
      key: "our",
      nodeLabel: "first Our Father bead",
    },
    "intro-our",
  );
  ["faith", "hope", "charity"].forEach((virtue, i) =>
    addStep(
      {
        key: "hail",
        note: "For an increase of " + virtue + ".",
        nodeLabel: "introductory Hail Mary " + (i + 1),
      },
      "intro-hail-" + (i + 1),
    ),
  );
  addStep(
    {
      key: "glory",
      nodeLabel: "introductory Glory Be bead",
    },
    "intro-glory",
  );
  for (let d = 0; d < 5; d++) {
    const start = "decade-" + (d + 1) + "-our";
    addStep(
      {
        key: "mystery",
        decade: d,
        nodeLabel: "Mystery " + (d + 1) + " Our Father bead",
      },
      start,
    );
    addStep(
      {
        key: "our",
        decade: d,
        nodeLabel: "Mystery " + (d + 1) + " Our Father bead",
      },
      start,
    );
    for (let n = 1; n <= 10; n++)
      addStep(
        {
          key: "hail",
          decade: d,
          count: n,
          nodeLabel: "Mystery " + (d + 1) + ", Hail Mary bead " + n,
        },
        "decade-" + (d + 1) + "-hail-" + n,
      );
    addStep(
      {
        key: "glory",
        decade: d,
        nodeLabel: "Mystery " + (d + 1) + ", after the ten Hail Marys",
      },
      "decade-" + (d + 1) + "-hail-10",
    );
    addStep(
      {
        key: "fatima",
        decade: d,
        nodeLabel: "Mystery " + (d + 1) + ", after the ten Hail Marys",
      },
      "decade-" + (d + 1) + "-hail-10",
    );
  }
  addStep(
    {
      key: "queen",
      nodeLabel: "Fifth mystery, concluding prayers",
    },
    "decade-5-hail-10",
  );
  addStep(
    {
      key: "closing",
      nodeLabel: "Fifth mystery, concluding prayers",
    },
    "decade-5-hail-10",
  );
  addStep(
    {
      key: "litany",
      nodeLabel: "Litany of the Blessed Virgin Mary",
    },
    "decade-5-hail-10",
  );
  addStep(
    {
      key: "traditional",
      nodeLabel: "Traditional closing prayer",
    },
    "decade-5-hail-10",
  );
  addStep(
    {
      key: "sign",
      type: "Concluding prayers",
      nodeLabel: "cross",
    },
    "cross",
  );

  return { steps, nodeToStep, orderedNodes };
}
