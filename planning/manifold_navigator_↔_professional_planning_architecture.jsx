import React from "react";
import ReactFlow, { Background, Controls, MiniMap, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";

// Custom node component for visual style
function Node({ data }) {
  const { label, caption, color } = data;
  return (
    <div
      style={{
        borderRadius: 16,
        border: `2px solid ${color}`,
        backgroundColor: `${color}15`,
        padding: "8px 12px",
        width: 240,
        boxShadow: `0 2px 6px ${color}33`,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color }} />
      <div style={{ fontWeight: 600, fontSize: 14, color }}>{label}</div>
      <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>{caption}</div>
      <Handle type="source" position={Position.Right} style={{ background: color }} />
    </div>
  );
}

const nodeTypes = { card: Node };

const nodes = [
  // Observer Loop (Reflective Layer)
  {
    id: "observer",
    type: "card",
    position: { x: 180, y: 60 },
    data: {
      label: "🌀 Observer Loop",
      caption:
        "Reflective intelligence: perceives, models, and synthesizes insights from manifold data. Defines direction and hypotheses.",
      color: "#2563eb",
    },
  },
  {
    id: "observer_outputs",
    type: "card",
    position: { x: 180, y: 190 },
    data: {
      label: "Observer Output Fields",
      caption: "Essence • Action Vectors • Confidence • Metrics • Reflection",
      color: "#3b82f6",
    },
  },

  // Knowledge Log / Context Mesh (Shared Memory)
  {
    id: "context",
    type: "card",
    position: { x: 460, y: 330 },
    data: {
      label: "🧠 Knowledge Log / Context Mesh",
      caption:
        "Collective working memory: stores structured runs, goals, values, and feedback across both loops.",
      color: "#6366f1",
    },
  },

  // Bridge
  {
    id: "bridge",
    type: "card",
    position: { x: 460, y: 190 },
    data: {
      label: "⚙️ Strategy–Execution Bridge",
      caption:
        "Translates Observer intent into Actor instructions; returns data and reflection to Observer.",
      color: "#10b981",
    },
  },

  // Actor Loop (Operational Layer)
  {
    id: "actor",
    type: "card",
    position: { x: 740, y: 60 },
    data: {
      label: "🚀 Actor Loop",
      caption:
        "Execution intelligence: performs actions, experiments, delivers outcomes, and reports feedback for learning.",
      color: "#f97316",
    },
  },
  {
    id: "actor_inputs",
    type: "card",
    position: { x: 740, y: 190 },
    data: {
      label: "Actor Input Fields",
      caption:
        "Projects • Tasks • Resources • Constraints • Deliverables • Signals to Watch",
      color: "#fb923c",
    },
  },
];

const edges = [
  // Observer → Bridge → Actor flow
  { id: "e1", source: "observer", target: "observer_outputs", label: "sense → synthesize", animated: true },
  { id: "e2", source: "observer_outputs", target: "bridge", label: "define intent → transmit" },
  { id: "e3", source: "bridge", target: "actor_inputs", label: "strategic intent → operational input", animated: true },
  { id: "e4", source: "actor", target: "actor_inputs", label: "plan → execute" },
  { id: "e5", source: "actor_inputs", target: "bridge", label: "report metrics & feedback" },
  { id: "e6", source: "bridge", target: "observer", label: "reflect & recalibrate", animated: true },
  // Shared memory links
  { id: "e7", source: "observer_outputs", target: "context", label: "log run data" },
  { id: "e8", source: "actor_inputs", target: "context", label: "update performance data" },
  { id: "e9", source: "context", target: "observer", label: "update understanding" },
  { id: "e10", source: "context", target: "actor", label: "provide context & alignment" },
];

export default function ObserverActorArchitecture() {
  return (
    <div className="w-full h-[700px] bg-slate-50">
      <div className="p-4">
        <h1 className="text-2xl font-semibold">Observer Loop ↔ Strategy–Execution Bridge ↔ Actor Loop</h1>
        <p className="text-slate-600 text-sm mt-1">
          Dual-loop cognitive architecture: blue (Observer) for reflective synthesis, orange (Actor) for embodied execution, green (Bridge) for translation and feedback, and violet (Context Mesh) for shared memory.
        </p>
      </div>
      <div className="h-[620px]">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
          <MiniMap pannable zoomable className="!bg-white !border !border-slate-200 !rounded-xl" />
          <Controls />
          <Background gap={16} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
