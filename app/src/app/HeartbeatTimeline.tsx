"use client";

import { motion } from "framer-motion";

const agents = [
  {
    title: "Legacy Docket Extractor",
    freq: "every 4h",
    action: "Query SQL",
    // Dots at 0h, 4h, 8h, 12h, 16h, 20h, 24h → positions as %
    dots: [0, 16.7, 33.3, 50, 66.7, 83.3, 100],
    activeIdx: 1,
  },
  {
    title: "Compliance Verifier",
    freq: "every 4h",
    action: "Audit Tier Rules",
    dots: [0, 16.7, 33.3, 50, 66.7, 83.3, 100],
    activeIdx: 0,
  },
  {
    title: "x402 Settlement Anchor",
    freq: "every 8h",
    action: "Batch ZK Proofs",
    dots: [0, 33.3, 66.7, 100],
    activeIdx: 0,
  },
];

const hours = ["0h", "4h", "8h", "12h", "16h", "20h", "24h"];

export default function HeartbeatTimeline() {
  return (
    <motion.div
      className="hb-widget"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
    >
      {/* Time axis */}
      <div className="hb-axis">
        {hours.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>

      {/* Agent rows */}
      {agents.map((agent) => (
        <motion.div
          key={agent.title}
          className="hb-row"
          variants={{
            hidden: { opacity: 0, x: -16 },
            visible: {
              opacity: 1,
              x: 0,
              transition: { duration: 0.5, ease: "easeOut" },
            },
          }}
        >
          <div className="hb-row-label">
            <div className="hb-row-title">{agent.title}</div>
            <div className="hb-row-freq">{agent.freq}</div>
          </div>
          <div className="hb-row-track">
            <div className="hb-track-line" />
            {agent.dots.map((pos, i) => (
              <div
                key={i}
                className={`hb-dot${i === agent.activeIdx ? " hb-dot-active" : ""}`}
                style={{ left: `${pos}%` }}
              >
                {i === agent.activeIdx && (
                  <span className="hb-dot-ping" />
                )}
              </div>
            ))}
            {/* Action tag near active dot */}
            <div
              className="hb-action"
              style={{ left: `${agent.dots[agent.activeIdx]}%` }}
            >
              {agent.action}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
