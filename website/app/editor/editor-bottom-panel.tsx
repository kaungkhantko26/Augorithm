"use client";

import { useEffect, useRef } from "react";
import type { Diagnostic, ExecutionSession } from "@/lib/augorithm-core";

export type BottomTab = "console" | "problems" | "variables";

interface EditorBottomPanelProps {
  activeTab: BottomTab;
  collapsed: boolean;
  output: string[];
  diagnostics: Diagnostic[];
  variables: Record<string, unknown>;
  input: string;
  pendingSession: ExecutionSession | null;
  inputError: string;
  onTabChange: (tab: BottomTab) => void;
  onToggle: () => void;
  onInputChange: (value: string) => void;
  onSubmitInput: () => void;
  onClear: () => void;
  onProblemSelect: (diagnostic: Diagnostic) => void;
}

export function EditorBottomPanel({
  activeTab,
  collapsed,
  output,
  diagnostics,
  variables,
  input,
  pendingSession,
  inputError,
  onTabChange,
  onToggle,
  onInputChange,
  onSubmitInput,
  onClear,
  onProblemSelect,
}: EditorBottomPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input whenever a new pending session arrives.
  useEffect(() => {
    if (pendingSession && inputRef.current) {
      inputRef.current.focus();
    }
  }, [pendingSession?.waitingFor]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: Array<{ id: BottomTab; label: string; count?: number }> = [
    { id: "console", label: "Console" },
    { id: "problems", label: "Problems", count: diagnostics.length },
    { id: "variables", label: "Variables", count: Object.keys(variables).length },
  ];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && pendingSession && input.trim()) {
      onSubmitInput();
    }
  };

  return (
    <section
      className={`editor-bottom-panel ${collapsed ? "collapsed" : ""}`}
      aria-label="Runtime and diagnostics"
    >
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
              {tab.label}
              {typeof tab.count === "number" ? <span>{tab.count}</span> : null}
            </button>
          ))}
        </div>
        <div>
          {!collapsed && <button type="button" onClick={onClear}>Clear</button>}
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand bottom panel" : "Collapse bottom panel"}
          >
            {collapsed ? "⌃" : "⌄"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="bottom-panel-content">
          {activeTab === "console" && (
            <div className="console-view">
              <pre className="console-output">
                {output.length ? output.join("\n") : "Press Run to execute the algorithm."}
              </pre>

              {pendingSession ? (
                /* ── Waiting for INPUT ── */
                <div className="console-input-waiting">
                  <label className="input-waiting-label">
                    <span className="input-waiting-badge">INPUT</span>
                    <span>
                      Waiting for input · Variable: <strong>{pendingSession.waitingFor}</strong>
                      <small>Expected type: {(() => {
                        const root = pendingSession.waitingFor.replace(/\[.*$/, "");
                        const value = pendingSession.variables[root];
                        return typeof value === "number" || Array.isArray(value) ? "Number" : "Text or number";
                      })()}</small>
                    </span>
                  </label>
                  <div className="input-waiting-row">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => onInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Value for ${pendingSession.waitingFor}…`}
                      aria-label={`Enter value for ${pendingSession.waitingFor}`}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="input-submit-btn"
                      onClick={onSubmitInput}
                      disabled={!input.trim()}
                    >
                      Submit ↵
                    </button>
                  </div>
                  {inputError && <p className="input-validation-error" role="alert">{inputError}</p>}
                </div>
              ) : (
                /* ── Normal input row ── */
                <label className="console-input-row">
                  <span>Program input</span>
                  <input
                    type="text"
                    value={input}
                    onChange={(event) => onInputChange(event.target.value)}
                    placeholder="Run the algorithm to provide input"
                    disabled
                  />
                </label>
              )}
            </div>
          )}

          {activeTab === "problems" && (
            <div className="problems-view">
              {diagnostics.length ? (
                diagnostics.map((diagnostic, index) => (
                  <button
                    type="button"
                    className={diagnostic.severity}
                    key={`${diagnostic.line}-${diagnostic.message}-${index}`}
                    onClick={() => onProblemSelect(diagnostic)}
                    title="Focus the related flowchart node"
                  >
                    <span aria-hidden="true">
                      {diagnostic.severity === "error" ? "●" : "▲"}
                    </span>
                    <div>
                      <strong>{diagnostic.message}</strong>
                      <small>Line {diagnostic.line}</small>
                    </div>
                  </button>
                ))
              ) : (
                <p className="panel-empty">✓ No problems found. Ready to run.</p>
              )}
            </div>
          )}

          {activeTab === "variables" && (
            <div className="variables-view">
              {Object.entries(variables).length ? (
                Object.entries(variables).map(([name, value]) => (
                  <div key={name}>
                    <code>{name}</code>
                    <strong>
                      {Array.isArray(value)
                        ? `[${value.map((v) => (v === undefined ? "—" : String(v))).join(", ")}]`
                        : value === undefined
                          ? "—"
                          : String(value)}
                    </strong>
                  </div>
                ))
              ) : (
                <p className="panel-empty">Variables appear here while your algorithm runs.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
