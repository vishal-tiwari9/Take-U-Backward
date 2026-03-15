// PATH: src/app/api/ar/topics/route.ts  — CREATE new file + folders
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getGroq } from "@/lib/groq";

// Static AR topic catalogue — in production these come from ARTopic in Prisma.
// Each topic ships with:
//  • logicJson: the JSON animation sequence R3F reads to drive step-by-step walkthroughs
//  • nodes: interactive points the 3D engine maps to AI tooltip content
 const AR_TOPICS = [
  {
    id: "bst",
    title: "Binary Search Tree",
    category: "Data Structures",
    emoji: "🌳",
    accentHex: "#7c3aed",
    difficulty: "Intermediate",
    description: "Visualise insert, search, and delete operations in a BST with animated node traversal.",
    modelType: "tree",
    nodes: ["Root", "Left Subtree", "Right Subtree", "Leaf Node", "Pointer"],
    logicJson: [
      { action:"highlight", node:"Root",         label:"Start at root",              duration:1.2 },
      { action:"compare",   node:"Left Subtree", label:"Value < root → go left",    duration:1.5 },
      { action:"traverse",  from:"Root",         to:"Left Subtree",                  duration:1.0 },
      { action:"highlight", node:"Leaf Node",    label:"Insert here",                duration:1.2 },
      { action:"spawn",     node:"Leaf Node",    label:"New node created ✓",         duration:1.0 },
    ],
  },
  {
    id: "blockchain",
    title: "Blockchain Ledger",
    category: "Web3",
    emoji: "⛓️",
    accentHex: "#f97316",
    difficulty: "Beginner",
    description: "See how blocks are chained via cryptographic hashes and how consensus is reached.",
    modelType: "chain",
    nodes: ["Genesis Block", "Block Header", "Merkle Root", "Nonce", "Hash Pointer"],
    logicJson: [
      { action:"highlight", node:"Genesis Block",  label:"Genesis — first block",     duration:1.2 },
      { action:"hash",      node:"Block Header",   label:"SHA-256 hash computed",     duration:1.5 },
      { action:"link",      from:"Block Header",   to:"Merkle Root",                  duration:1.0 },
      { action:"mine",      node:"Nonce",          label:"Proof-of-work mining…",     duration:2.0 },
      { action:"confirm",   node:"Hash Pointer",   label:"Block confirmed ✓",         duration:1.0 },
    ],
  },
  {
    id: "neural-net",
    title: "Neural Network",
    category: "AI / ML",
    emoji: "🧠",
    accentHex: "#c084fc",
    difficulty: "Advanced",
    description: "Forward pass, activation functions, and backpropagation through a live network.",
    modelType: "network",
    nodes: ["Input Layer", "Hidden Layer 1", "Hidden Layer 2", "ReLU Activation", "Output Layer"],
    logicJson: [
      { action:"highlight", node:"Input Layer",    label:"Feed input tensor",         duration:1.0 },
      { action:"forward",   from:"Input Layer",    to:"Hidden Layer 1",               duration:1.2 },
      { action:"activate",  node:"ReLU Activation",label:"ReLU(x) = max(0,x)",       duration:1.0 },
      { action:"forward",   from:"Hidden Layer 1", to:"Hidden Layer 2",               duration:1.2 },
      { action:"output",    node:"Output Layer",   label:"Softmax → prediction",      duration:1.0 },
      { action:"backprop",  from:"Output Layer",   to:"Input Layer",                  duration:2.0 },
    ],
  },
  {
    id: "sorting",
    title: "Sorting Algorithms",
    category: "Algorithms",
    emoji: "📊",
    accentHex: "#38bdf8",
    difficulty: "Beginner",
    description: "Watch QuickSort, MergeSort, and HeapSort race side-by-side with live swaps.",
    modelType: "bars",
    nodes: ["Pivot", "Left Partition", "Right Partition", "Comparator", "Sorted Region"],
    logicJson: [
      { action:"pick",      node:"Pivot",           label:"Choose pivot element",      duration:1.0 },
      { action:"partition", node:"Left Partition",  label:"Elements < pivot",          duration:1.5 },
      { action:"partition", node:"Right Partition", label:"Elements > pivot",          duration:1.5 },
      { action:"recurse",   from:"Left Partition",  to:"Pivot",                        duration:1.2 },
      { action:"merge",     node:"Sorted Region",   label:"Fully sorted ✓",           duration:1.0 },
    ],
  },
  {
    id: "tcp-ip",
    title: "TCP/IP Stack",
    category: "Networking",
    emoji: "🌐",
    accentHex: "#34d399",
    difficulty: "Intermediate",
    description: "Follow a data packet from application layer to physical layer and back.",
    modelType: "layers",
    nodes: ["Application", "Transport (TCP)", "Network (IP)", "Data Link", "Physical"],
    logicJson: [
      { action:"send",      node:"Application",    label:"HTTP request created",       duration:1.0 },
      { action:"wrap",      node:"Transport (TCP)",label:"TCP segment — port 443",     duration:1.2 },
      { action:"route",     node:"Network (IP)",   label:"IP packet — source & dest",  duration:1.2 },
      { action:"frame",     node:"Data Link",      label:"Ethernet frame + MAC",       duration:1.0 },
      { action:"transmit",  node:"Physical",       label:"Bits on the wire →",         duration:1.5 },
    ],
  },
  {
    id: "kubernetes",
    title: "Kubernetes Cluster",
    category: "DevOps",
    emoji: "🚀",
    accentHex: "#fbbf24",
    difficulty: "Advanced",
    description: "See how the scheduler places pods, how services route traffic, and HPA scales.",
    modelType: "cluster",
    nodes: ["Control Plane", "etcd", "Scheduler", "Worker Node", "Pod"],
    logicJson: [
      { action:"schedule",  node:"Scheduler",      label:"Pod scheduled to node",      duration:1.2 },
      { action:"store",     node:"etcd",           label:"State persisted to etcd",    duration:1.0 },
      { action:"spawn",     node:"Pod",            label:"Container running ✓",        duration:1.5 },
      { action:"scale",     from:"Pod",            to:"Worker Node",                   duration:1.2 },
      { action:"route",     node:"Control Plane",  label:"Service mesh updated",       duration:1.0 },
    ],
  },
  {
    id: "react-tree",
    title: "React Component Tree",
    category: "Frontend",
    emoji: "⚛️",
    accentHex: "#60a5fa",
    difficulty: "Beginner",
    description: "Understand reconciliation, virtual DOM diffing, and re-render propagation.",
    modelType: "tree",
    nodes: ["Root Component", "Context Provider", "Child A", "Child B", "Leaf"],
    logicJson: [
      { action:"render",    node:"Root Component", label:"Initial render",             duration:1.0 },
      { action:"diff",      node:"Context Provider",label:"Context value changed",     duration:1.2 },
      { action:"skip",      node:"Child A",        label:"Memo — no re-render",        duration:1.0 },
      { action:"update",    node:"Child B",        label:"Subscribed — re-renders",    duration:1.2 },
      { action:"commit",    node:"Leaf",           label:"DOM patched ✓",             duration:1.0 },
    ],
  },
  {
    id: "db-indexing",
    title: "Database Indexing",
    category: "Backend",
    emoji: "🗄️",
    accentHex: "#f472b6",
    difficulty: "Intermediate",
    description: "Walk through B-Tree indexing, sequential scans vs index scans, and query plans.",
    modelType: "tree",
    nodes: ["B-Tree Root", "Index Node", "Leaf Page", "Row Pointer", "Heap File"],
    logicJson: [
      { action:"query",     node:"B-Tree Root",   label:"SELECT WHERE id = 42",       duration:1.0 },
      { action:"traverse",  from:"B-Tree Root",   to:"Index Node",                    duration:1.2 },
      { action:"compare",   node:"Index Node",    label:"id=42 found in index",       duration:1.0 },
      { action:"fetch",     from:"Index Node",    to:"Row Pointer",                   duration:1.2 },
      { action:"return",    node:"Heap File",     label:"Row data returned ✓",        duration:1.0 },
    ],
  },
];

// GET /api/ar/topics — returns all topics
export async function GET() {
  return NextResponse.json({ topics: AR_TOPICS });
}

// POST /api/ar/topics/whisper — AI generates contextual interview tip for a node
export async function POST(req: Request) {
  try {
    const { topicTitle, nodeName, category } = await req.json();
    if (!topicTitle || !nodeName) return NextResponse.json({ tip: "" }, { status: 400 });

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content: `You are a senior engineer whispering a crisp, actionable interview tip to a student 
who is looking at the "${nodeName}" node in a 3D AR visualisation of "${topicTitle}" (category: ${category}).
Write ONE sentence (max 25 words). Be specific, not generic. No fluff. Start with "💡".`,
        },
        { role: "user", content: `Give me the interview tip for the "${nodeName}" concept.` },
      ],
    });

    const tip = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ tip });
  } catch {
    return NextResponse.json({ tip: "" }, { status: 500 });
  }
}