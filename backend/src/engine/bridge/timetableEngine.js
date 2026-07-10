import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runTimetableEngine = (data) => {
  return new Promise((resolve, reject) => {
    const pyPath = path.resolve(__dirname, "../../python_engine/main.py");
    const py = spawn("python3", [pyPath]);

    let result = "";
    let errorOutput = "";
    let settled = false;

    const fail = (reason) => {
      if (settled) return;
      settled = true;
      reject(new Error(reason));
    };

    py.stdin.on("error", (err) => fail(`stdin error: ${err.message}`));
    py.on("error", (err) => fail(`Failed to spawn Python: ${err.message}`));

    try {
      py.stdin.write(JSON.stringify(data));
      py.stdin.end();
    } catch (err) {
      fail(`Failed to write to Python stdin: ${err.message}`);
      return;
    }

    py.stdout.on("data", (chunk) => {
      result += chunk.toString();
    });

    py.stderr.on("data", (err) => {
      errorOutput += err.toString();
    });

    py.on("close", (code) => {
      if (settled) return;
      settled = true;

      if (code !== 0) {
        return reject(
          new Error(errorOutput || `Python exited with code ${code}`),
        );
      }

      try {
        resolve(JSON.parse(result));
      } catch (err) {
        reject(new Error(`Invalid JSON from Python: ${result}`));
      }
    });
  });
};
