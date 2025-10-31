import React, { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";

// Rounded card node with caption
function Node({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white shadow-lg rounded-2xl border border-slate-200 px-4 py-3 w-72"
    >
      <div className="text-sm font-semibold leading-tight">{data.label}</div>
      {data.caption && (
        <div className="text-xs text-slate-600 mt-1 leading-snug">{data.caption}</div>
      )}
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
    </motion.div>
  );
}

const nodeTypes = { card: Node };

const nodes = [
  // Inputs & logging
  {
    id: "controls",
    type: "card",
    position: { x: 40, y: 10 },
    data: {
      label: "Optional Controls",
      caption:
        "context • goal • depth • style • tone • time-horizon • focus • confidence-calibration • visualization • recursion • constraints • resources • risk-appetite • option_count • counterfactual_pass • temperament • evidence_bias • failure_premortem • privacy • minimal_output • navigator_preset",
    },
  },
  {
    id: "log",
    type: "card",
    position: { x: 40, y: 360 },
    data: {
      label: "Manifold Log",
      caption: "schema_version • run_id • timestamp • export JSON/MD • trends",
    },
  },

  // Core pipeline
  {
    id: "raw",
    type: "card",
    position: { x: 40, y: 190 },
    data: {
      label: "Raw Input",
      caption: "Free writing • notes • associations • somatic cues",
    },
  },
  {
    id: "ingest",
    type: "card",
    position: { x: 280, y: 190 },
    data: {
      label: "Ingest / Parse",
      caption: "Clean, segment, normalize; preserve nuance",
    },
  },
  {
    id: "latents",
    type: "card",
    position: { x: 520, y: 190 },
    data: {
      label: "Extract Latents",
      caption: "Themes • values • tensions • attractors",
    },
  },
  {
    id: "map",
    type: "card",
    position: { x: 760, y: 190 },
    data: {
      label: "Map Dimensions",
      caption: "Name semantic axes (e.g., Autonomy ↔ Connection)",
    },
  },
  {
    id: "assumptions",
    type: "card",
    position: { x: 1000, y: 110 },
    data: {
      label: "Assumptions & Unknowns",
      caption: "List assumptions; identify what evidence would change them",
    },
  },
  {
    id: "weight",
    type: "card",
    position: { x: 1000, y: 270 },
    data: {
      label: "Weight Confidence",
      caption: "0–1 + 1‑line rationale + evidence pointer",
    },
  },
  {
    id: "reduce",
    type: "card",
    position: { x: 1240, y: 190 },
    data: {
      label: "Synthesize Reduction",
      caption: "Gist • narrative • essence statement",
    },
  },
  {
    id: "embodied",
    type: "card",
    position: { x: 1460, y: 120 },
    data: {
      label: "Embodied Check‑In",
      caption: "Body sense: contracted • neutral • expansive — adjust if misaligned",
    },
  },
  {
    id: "counterfactual",
    type: "card",
    position: { x: 1460, y: 260 },
    data: {
      label: "Counterfactual Pass",
      caption: "Generate a contrarian essence/action for contrast",
    },
  },
  {
    id: "actions",
    type: "card",
    position: { x: 1680, y: 190 },
    data: {
      label: "Action Vectors",
      caption: "1–3 steps • horizon ladder (today/week/month) • energy • success_metric",
    },
  },
  {
    id: "metrics",
    type: "card",
    position: { x: 1900, y: 110 },
    data: {
      label: "Metrics & Review",
      caption: "Signals to watch • decision record: why this / not that",
    },
  },
  {
    id: "reflect",
    type: "card",
    position: { x: 1900, y: 270 },
    data: {
      label: "Reflection",
      caption: "Expand • Refine • Collapse",
    },
  },

  // Presets pane
  {
    id: "presets",
    type: "card",
    position: { x: 40, y: 540 },
    data: {
      label: "Presets",
      caption: "Discovery Burst • Weekly Compass • Bold Move Audit • Minimal‑Output",
    },
  },
];

const edges = [
  // Core flow
  { id: "e1", source: "raw", target: "ingest" },
  { id: "e2", source: "ingest", target: "latents" },
  { id: "e3", source: "latents", target: "map" },
  { id: "e4a", source: "map", target: "assumptions" },
  { id: "e4b", source: "map", target: "weight" },
  { id: "e5", source: "assumptions", target: "weight", type: "smoothstep" },
  { id: "e6", source: "weight", target: "reduce" },
  { id: "e7a", source: "reduce", target: "embodied" },
  { id: "e7b", source: "reduce", target: "counterfactual" },
  { id: "e8a", source: "embodied", target: "actions" },
  { id: "e8b", source: "counterfactual", target: "actions", type: "smoothstep" },
  { id: "e9a", source: "actions", target: "metrics" },
  { id: "e9b", source: "actions", target: "reflect" },
  { id: "e10", source: "metrics", target: "reflect", type: "smoothstep" },

  // Reflection branches & recursion
  { id: "e11", source: "reflect", target: "raw", label: "new material", animated: true },
  { id: "e12", source: "reflect", target: "reduce", label: "refine essence", animated: true },

  // Logging taps
  { id: "l1", source: "reduce", target: "log", type: "smoothstep" },
  { id: "l2", source: "actions", target: "log", type: "smoothstep" },
  { id: "l3", source: "reflect", target: "log", type: "smoothstep" },
];

export default function ManifoldNavigatorSystemMap() {
  const onInit = useCallback((instance) => instance.fitView(), []);

  return (
    <div className="w-full h-[820px] bg-slate-50">
      <div className="p-4">
        <h1 className="text-2xl font-semibold">Manifold Navigator — System Map v1.2</h1>
        <p className="text-slate-600 text-sm mt-1">
          Pipeline with assumptions, embodied check, counterfactuals, metrics, presets, and expanded controls.
        </p>
      </div>
      <div className="h-[740px]">
        <ReactFlow nodes={nodes} edges={edges} onInit={onInit} nodeTypes={nodeTypes} fitView>
          <MiniMap pannable zoomable className="!bg-white !border !border-slate-200 !rounded-xl" />
          <Controls />
          <Background gap={16} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
