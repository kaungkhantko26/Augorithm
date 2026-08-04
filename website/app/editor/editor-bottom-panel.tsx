"use client";

import { useEffect, useRef, useState } from "react";
import type { Diagnostic, ExecutionSession } from "@/lib/augorithm-core";

export type BottomTab = "console" | "problems" | "variables" | "notes";

function ValueExplorer({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === undefined) return <span className="value-empty">undefined</span>;
  if (value === null) return <span className="value-empty">null</span>;
  if (typeof value === "string") return <span className="value-string">“{value}”</span>;
  if (typeof value === "number") return <span className="value-number">{value}</span>;
  if (typeof value === "boolean") return <span className="value-boolean">{String(value)}</span>;
  if (depth >= 4) return <span className="value-empty">Nested value</span>;

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : typeof value === "object"
      ? Object.entries(value as Record<string, unknown>)
      : [];
  const label = Array.isArray(value) ? `Array(${entries.length})` : `Object(${entries.length})`;
  const visibleEntries = entries.slice(0, 100);

  return (
    <details className="value-explorer" open={depth === 0 && entries.length <= 12}>
      <summary>{label}</summary>
      <div className="value-children">
        {visibleEntries.map(([key, item]) => (
          <div className="value-child" key={key}>
            <code>{key}</code>
            <ValueExplorer value={item} depth={depth + 1} />
          </div>
        ))}
        {entries.length > visibleEntries.length && <p>+ {entries.length - visibleEntries.length} more items</p>}
      </div>
    </details>
  );
}

interface EditorBottomPanelProps {
  activeTab: BottomTab;
  collapsed: boolean;
  output: string[];
  diagnostics: Diagnostic[];
  variables: Record<string, unknown>;
  input: string;
  pendingSession: ExecutionSession | null;
  inputError: string;
  notes: string;
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
  notes,
  onTabChange,
  onToggle,
  onInputChange,
  onSubmitInput,
  onClear,
  onProblemSelect,
}: EditorBottomPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragStart = useRef<{ y: number; height: number } | null>(null);
  const [panelHeight, setPanelHeight] = useState(() => {
    if (typeof window === "undefined") return 220;
    const savedHeight = Number(window.localStorage.getItem("augorithm-runtime-height"));
    return savedHeight >= 168 && savedHeight <= 420 ? savedHeight : 220;
  });
  const [variableQuery, setVariableQuery] = useState("");
  const [jumpIndex, setJumpIndex] = useState("");

  useEffect(() => {
    window.localStorage.setItem("augorithm-runtime-height", String(panelHeight));
  }, [panelHeight]);

  // Auto-focus the input whenever a new pending session arrives.
  useEffect(() => {
    if (pendingSession && inputRef.current) {
      inputRef.current.focus();
    }
  }, [pendingSession?.waitingFor]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: Array<{ id: BottomTab; label: string; count?: number }> = [
    { id: "console", label: "Console" },
    { id: "variables", label: "Variables", count: Object.keys(variables).length || undefined },
    { id: "problems", label: "Problems", count: diagnostics.length || undefined },
    { id: "notes", label: "Notes" },
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
      style={collapsed ? undefined : { height: panelHeight }}
    >
      {!collapsed && <div
        className="runtime-resize-handle"
        role="separator"
        aria-label="Resize runtime panel"
        aria-orientation="horizontal"
        tabIndex={0}
        onPointerDown={(event) => {
          dragStart.current = { y: event.clientY, height: panelHeight };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragStart.current) return;
          setPanelHeight(Math.max(168, Math.min(420, dragStart.current.height + dragStart.current.y - event.clientY)));
        }}
        onPointerUp={() => { dragStart.current = null; }}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") setPanelHeight((value) => Math.min(420, value + 16));
          if (event.key === "ArrowDown") setPanelHeight((value) => Math.max(168, value - 16));
        }}
      ><span /></div>}
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
              <div className="execution-log" role="table" aria-label="Execution log">
                <div className="execution-log-head" role="row"><span>Step</span><span>Type</span><span>Message</span></div>
                {(output.length ? output : [pendingSession ? "Execution paused. Enter a value to continue." : "Press Run to execute the algorithm."]).map((message, index) => {
                  const type = pendingSession && index === output.length ? "Input" : /error|failed/i.test(message) ? "Error" : index === 0 && output.length ? "Info" : "Output";
                  return <div className={`execution-log-row type-${type.toLowerCase()}`} role="row" key={`${index}-${message}`}><span>{index + 1}</span><strong>{type}</strong><code>{message}</code></div>;
                })}
              </div>

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
              <div className="variables-tools">
                <label><span className="sr-only">Search variables</span><input value={variableQuery} onChange={(event) => setVariableQuery(event.target.value)} placeholder="Search variables…" /></label>
                <label><span>Jump to index</span><input inputMode="numeric" value={jumpIndex} onChange={(event) => setJumpIndex(event.target.value.replace(/\D/g, ""))} placeholder="0" /></label>
              </div>
              <div className="variable-columns" aria-hidden="true"><span>Name / type</span><span>Value</span></div>
              {Object.entries(variables).filter(([name]) => name.toLowerCase().includes(variableQuery.toLowerCase())).length ? (
                <div className="variable-list">{Object.entries(variables).filter(([name]) => name.toLowerCase().includes(variableQuery.toLowerCase())).map(([name, value]) => (
                  <article className="variable-row" key={name}>
                    <div className="variable-identity"><code>{name}</code><span>{Array.isArray(value) ? `Array · ${value.length} items` : value === null ? "null" : typeof value}</span></div>
                    <div className="variable-value">{Array.isArray(value) && jumpIndex !== "" && Number(jumpIndex) < value.length ? <div className="jump-result"><span>Index {jumpIndex}</span><ValueExplorer value={value[Number(jumpIndex)]} depth={1} /></div> : <ValueExplorer value={value} />}</div>
                  </article>
                ))}</div>
              ) : (
                <p className="panel-empty">Variables appear here while your algorithm runs.</p>
              )}
            </div>
          )}
          {activeTab === "notes" && <pre className="bottom-notes">{notes}</pre>}
        </div>
      )}
    </section>
  );
}
