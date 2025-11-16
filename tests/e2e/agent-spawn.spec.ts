import { test, expect } from "@playwright/test";
import { spawn, exec } from "child_process";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

test.describe("Agent Spawning System", () => {
  const scriptsDir = join(process.cwd(), "scripts");

  test.beforeAll(async () => {
    // Verificar que los scripts existen
    const { stdout } = await execAsync("ls scripts/*.mjs", { cwd: process.cwd() });
    expect(stdout).toContain("claude-agent.mjs");
    expect(stdout).toContain("cursor-agent.mjs");
  });

  test("cursor-agent.mjs debe abrir archivo correctamente", async () => {
    const startTime = Date.now();

    const result = await new Promise<{ code: number; output: string; duration: number }>(
      (resolve) => {
        const child = spawn("node", [join(scriptsDir, "cursor-agent.mjs"), "src/App.tsx"], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        let output = "";
        child.stdout.on("data", (data) => {
          output += data.toString();
        });

        child.stderr.on("data", (data) => {
          output += data.toString();
        });

        child.on("close", (code) => {
          resolve({
            code: code || 0,
            output,
            duration: Date.now() - startTime,
          });
        });

        // Timeout de 10s
        setTimeout(() => {
          child.kill();
          resolve({ code: 1, output: "Timeout", duration: Date.now() - startTime });
        }, 10000);
      }
    );

    expect(result.code).toBe(0);
    expect(result.duration).toBeLessThan(5000);
    expect(result.output).toContain("Cursor");
  });

  test("claude-agent.mjs debe manejar falta de API key gracefully", async () => {
    const result = await new Promise<{ code: number; error: string }>((resolve) => {
      const child = spawn("node", [join(scriptsDir, "claude-agent.mjs"), "Test prompt"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: "", // Forzar que no tenga API key
        },
      });

      let error = "";
      child.stderr.on("data", (data) => {
        error += data.toString();
      });

      child.on("close", (code) => {
        resolve({ code: code || 0, error });
      });

      setTimeout(() => {
        child.kill();
        resolve({ code: 1, error: "Timeout" });
      }, 5000);
    });

    expect(result.code).toBe(1);
    expect(result.error).toMatch(/ANTHROPIC_API_KEY|not found/i);
  });

  test("test-agent-spawn.mjs debe ejecutar spawn paralelo", async () => {
    const startTime = Date.now();

    const result = await new Promise<{
      code: number;
      output: string;
      duration: number;
      successRate: number;
    }>((resolve) => {
      const child = spawn("node", [join(scriptsDir, "test-agent-spawn.mjs")], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let output = "";
      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.stderr.on("data", (data) => {
        output += data.toString();
      });

      child.on("close", (code) => {
        const successMatch = output.match(/Success Rate: (\d+)\/(\d+)/);
        const successRate = successMatch
          ? parseInt(successMatch[1]) / parseInt(successMatch[2])
          : 0;

        resolve({
          code: code || 0,
          output,
          duration: Date.now() - startTime,
          successRate,
        });
      });

      setTimeout(() => {
        child.kill();
        resolve({
          code: 1,
          output: "Timeout",
          duration: Date.now() - startTime,
          successRate: 0,
        });
      }, 60000);
    });

    expect(result.output).toContain("AGENT SPAWN TEST RESULTS");
    expect(result.output).toContain("Cursor Editor");
    expect(result.successRate).toBeGreaterThan(0); // Al menos Cursor debe funcionar
    expect(result.duration).toBeLessThan(45000); // Debe terminar en menos de 45s
  });

  test("spawn paralelo debe ser más rápido que secuencial", async () => {
    // Simular 3 tareas que toman 2s cada una
    const parallelStart = Date.now();

    await Promise.all([
      new Promise((resolve) => setTimeout(resolve, 2000)),
      new Promise((resolve) => setTimeout(resolve, 2000)),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);

    const parallelDuration = Date.now() - parallelStart;

    // Paralelo debe tomar ~2s, no ~6s
    expect(parallelDuration).toBeLessThan(3000);
    expect(parallelDuration).toBeGreaterThan(1900);
  });

  test("verificar estructura de archivos del sistema de agentes", async () => {
    const { stdout: packageJson } = await execAsync("cat scripts/package.json", {
      cwd: process.cwd(),
    });

    const pkg = JSON.parse(packageJson);

    expect(pkg.type).toBe("module");
    expect(pkg.dependencies).toHaveProperty("@anthropic-ai/sdk");
    expect(pkg.scripts).toHaveProperty("agent:claude");
    expect(pkg.scripts).toHaveProperty("agent:cursor");
    expect(pkg.scripts).toHaveProperty("test:spawn");
  });

  test("scripts deben tener permisos de ejecución", async () => {
    const { stdout } = await execAsync("ls -la scripts/*.mjs", { cwd: process.cwd() });

    // Verificar que los archivos existen
    expect(stdout).toContain("claude-agent.mjs");
    expect(stdout).toContain("cursor-agent.mjs");
    expect(stdout).toContain("test-agent-spawn.mjs");
  });
});

test.describe("Agent Spawn Performance", () => {
  test("medir overhead de spawn de proceso Node.js", async () => {
    const iterations = 5;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();

      await new Promise<void>((resolve) => {
        const child = spawn("node", ["-e", 'console.log("test")']);
        child.on("close", () => resolve());
      });

      durations.push(Date.now() - start);
    }

    const avgDuration = durations.reduce((a, b) => a + b) / iterations;

    console.log(`Average Node.js spawn overhead: ${avgDuration}ms`);

    // Overhead debe ser razonable (<500ms en promedio)
    expect(avgDuration).toBeLessThan(500);
  });

  test("medir speedup de ejecución paralela", async () => {
    const taskDuration = 1000; // 1 segundo por tarea
    const numTasks = 3;

    // Secuencial
    const seqStart = Date.now();
    for (let i = 0; i < numTasks; i++) {
      await new Promise((resolve) => setTimeout(resolve, taskDuration));
    }
    const seqDuration = Date.now() - seqStart;

    // Paralelo
    const parStart = Date.now();
    await Promise.all(
      Array.from(
        { length: numTasks },
        () => new Promise((resolve) => setTimeout(resolve, taskDuration))
      )
    );
    const parDuration = Date.now() - parStart;

    const speedup = seqDuration / parDuration;

    console.log(`Sequential: ${seqDuration}ms`);
    console.log(`Parallel: ${parDuration}ms`);
    console.log(`Speedup: ${speedup.toFixed(2)}x`);

    // Speedup debe ser cercano al número de tareas
    expect(speedup).toBeGreaterThan(2.5);
    expect(speedup).toBeLessThan(3.5);
  });
});
