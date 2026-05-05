"use client";

import { useState } from "react";

const tabs = [
  { label: "install", command: "npm install @adduce/sdk" },
  { label: "use", command: 'import { AdduceClient } from "@adduce/sdk"' },
];

export default function TerminalTabs() {
  const [active, setActive] = useState(0);

  return (
    <div className="terminal-box">
      <div className="terminal-bar">
        <div className="terminal-dots">
          <span />
          <span />
          <span />
        </div>
        <div className="terminal-tabs">
          {tabs.map((tab, i) => (
            <span
              key={tab.label}
              className={`terminal-tab${i === active ? " active" : ""}`}
              onClick={() => setActive(i)}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>
      <div className="terminal-body">
        <span className="prompt">$</span>
        {tabs[active].command}
      </div>
    </div>
  );
}
