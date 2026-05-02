"use client";

import { motion } from "framer-motion";

export default function ArchDiagram() {
  return (
    <div className="jurisdiction-diagram">
      <motion.div
        className="arch"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
      >
        {/* ── Top: Core Engine ── */}
        <motion.div
          className="arch-core"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <div className="arch-icon arch-icon-core">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="arch-title">Adduce Engine</div>
          <div className="arch-provider">
            <span className="arch-dot arch-dot-green" />
            Solana
          </div>
        </motion.div>

        {/* ── SVG connector lines ── */}
        <motion.svg
          className="arch-lines"
          viewBox="0 0 460 60"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.4 } },
          }}
        >
          {/* Center vertical from core */}
          <line x1="230" y1="0" x2="230" y2="20" stroke="#e5e3df" strokeWidth="1.5" />
          {/* Horizontal bar */}
          <line x1="77" y1="20" x2="383" y2="20" stroke="#e5e3df" strokeWidth="1.5" />
          {/* Verticals down to each plugin */}
          <line x1="77" y1="20" x2="77" y2="60" stroke="#e5e3df" strokeWidth="1.5" />
          <line x1="230" y1="20" x2="230" y2="60" stroke="#e5e3df" strokeWidth="1.5" />
          <line x1="383" y1="20" x2="383" y2="60" stroke="#e5e3df" strokeWidth="1.5" />
        </motion.svg>

        {/* ── Middle row: 3 modules ── */}
        <div className="arch-modules">
          <motion.div
            className="arch-module arch-module-active"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
            }}
          >
            <div className="arch-module-badge">Active</div>
            <div className="arch-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="arch-title">Eligibility PDA</div>
            <div className="arch-provider">
              <span className="arch-dot arch-dot-green" />
              SAS
            </div>
          </motion.div>

          <motion.div
            className="arch-module"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
            }}
          >
            <div className="arch-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="arch-title">Treasury Mint</div>
            <div className="arch-provider">
              <span className="arch-dot arch-dot-green" />
              x402
            </div>
          </motion.div>

          <motion.div
            className="arch-module"
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
            }}
          >
            <div className="arch-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                <path d="M9 12h6M12 9v6" />
              </svg>
            </div>
            <div className="arch-title">Court API</div>
            <div className="arch-provider">
              <span className="arch-dot arch-dot-green" />
              Helius
            </div>
          </motion.div>
        </div>

        {/* ── SVG connector lines to bottom row ── */}
        <motion.svg
          className="arch-lines"
          viewBox="0 0 460 50"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.4, delay: 0.1 } },
          }}
        >
          {/* From middle-left module down */}
          <line x1="153" y1="0" x2="153" y2="18" stroke="#e5e3df" strokeWidth="1.5" />
          {/* Horizontal bar */}
          <line x1="153" y1="18" x2="307" y2="18" stroke="#e5e3df" strokeWidth="1.5" />
          {/* Verticals down to bottom nodes */}
          <line x1="153" y1="18" x2="153" y2="50" stroke="#e5e3df" strokeWidth="1.5" />
          <line x1="307" y1="18" x2="307" y2="50" stroke="#e5e3df" strokeWidth="1.5" />
        </motion.svg>

        {/* ── Bottom row: 2 workers ── */}
        <div className="arch-workers">
          <motion.div
            className="arch-worker"
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
            }}
          >
            <div className="arch-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="arch-title">ZK Anchor</div>
            <div className="arch-provider">
              <span className="arch-dot arch-dot-green" />
              Light Protocol
            </div>
          </motion.div>

          <motion.div
            className="arch-worker"
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
            }}
          >
            <div className="arch-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="arch-title">Audit Log</div>
            <div className="arch-provider">
              <span className="arch-dot arch-dot-green" />
              Photon Indexer
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
