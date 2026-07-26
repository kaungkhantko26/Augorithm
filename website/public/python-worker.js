let pyodideReady;

async function getPyodide() {
  if (!pyodideReady) {
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");
    pyodideReady = loadPyodide();
  }
  return pyodideReady;
}

self.onmessage = async (event) => {
  const { code, input = "" } = event.data || {};
  const output = [];
  try {
    const pyodide = await getPyodide();
    const values = String(input).split(/[,\n]/);
    let index = 0;
    pyodide.setStdout({ batched: (value) => output.push(value) });
    pyodide.setStderr({ batched: (value) => output.push(value) });
    pyodide.setStdin({ stdin: () => values[index++] ?? "" });
    await pyodide.runPythonAsync(String(code));
    self.postMessage({ status: "complete", output });
  } catch (error) {
    self.postMessage({ status: "error", error: error instanceof Error ? error.message : String(error), output });
  }
};
