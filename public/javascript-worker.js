self.onmessage = (event) => {
  const { code, input = "" } = event.data || {};
  const values = String(input).split(/[,\n]/).map((value) => value.trim());
  const output = [];
  let index = 0;
  const safeConsole = {
    log: (...items) => output.push(items.map(String).join(" ")),
  };
  const prompt = () => values[index++] ?? "";
  try {
    Function("console", "prompt", `"use strict";\n${String(code)}`)(safeConsole, prompt);
    self.postMessage({ status: "complete", output });
  } catch (error) {
    self.postMessage({ status: "error", error: error instanceof Error ? error.message : String(error), output });
  }
};
