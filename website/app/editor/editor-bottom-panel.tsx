"use client";

import type { Diagnostic } from "@/lib/augorithm-core";

export type BottomTab = "console" | "problems" | "variables";

interface EditorBottomPanelProps {
  activeTab: BottomTab;
  collapsed: boolean;
  output: string[];
  diagnostics: Diagnostic[];
  variables: Record<string, unknown>;
  input: string;
  onTabChange: (tab: BottomTab) => void;
  onToggle: () => void;
  onInputChange: (value: string) => void;
  onClear: () => void;
}

export function EditorBottomPanel({
  activeTab,
  collapsed,
  output,
  diagnostics,
  variables,
  input,
  onTabChange,
  onToggle,
  onInputChange,
  onClear,
}: EditorBottomPanelProps) {
  const tabs: Array<{ id: BottomTab; label: string; count?: number }> = [
    { id: "console", label: "Console" },
    { id: "problems", label: "Problems", count: diagnostics.length },
    { id: "variables", label: "Variables", count: Object.keys(variables).length },
  ];

  return (
    <section className={`editor-bottom-panel ${collapsed ? "collapsed" : ""}`} aria-label="Runtime and diagnostics">
      <div className="bottom-tabs">
        <div role="tablist" aria-label="Bottom panel">
          {tabs.map((tab) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => {
                onTabChange(tab.id);
                if (collapsed) onToggle();
              }}
              key={tab.id}
            >
              {tab.label}{typeof tab.count === "number" ? <span>{tab.count}</span> : null}
            </button>
          ))}
        </div>
        <div>
          {!collapsed && <button type="button" onClick={onClear}>Clear</button>}
          <button type="button" onClick={onToggle} aria-label={collapsed ? "Expand bottom panel" : "Collapse bottom panel"}>
            {collapsed ? "⌃" : "⌄"}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="bottom-panel-content">
          {activeTab === "console" && (
            <div className="console-view">
              <pre>{output.length ? output.join("\n") : "Press Run to execute the algorithm."}</pre>
              <label><span>Program input</span><input value={input} onChange={(event) => onInputChange(event.target.value)} placeholder="e.g. 75, Alice" /></label>
            </div>
          )}
          {activeTab === "problems" && (
            <div className="problems-view">
              {diagnostics.length ? diagnostics.map((diagnostic, index) => (
                <article className={diagnostic.severity} key={`${diagnostic.line}-${diagnostic.message}-${index}`}>
                  <span aria-hidden="true">{diagnostic.severity === "error" ? "●" : "▲"}</span>
                  <div><strong>{diagnostic.message}</strong><small>Line {diagnostic.line}</small></div>
                </article>
              )) : <p className="panel-empty">✓ No problems found. Ready to run.</p>}
            </div>
          )}
          {activeTab === "variables" && (
            <div className="variables-view">
              {Object.entries(variables).length ? Object.entries(variables).map(([name, value]) => (
                <div key={name}><code>{name}</code><strong>{String(value)}</strong></div>
              )) : <p className="panel-empty">Variables appear here while your algorithm runs.</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
