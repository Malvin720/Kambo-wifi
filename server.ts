import express from "express";
import path from "path";
import apiRouter from "./server/routes";
import { getDatabase } from "./server/database";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database and seed it
  console.log("Initializing database...");
  try {
    await getDatabase();
    console.log("Database initialized successfully!");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }

  // Parse JSON bodies
  app.use(express.json());

  // Log requests in dev
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Dev Server: Vite middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Prod Server: Serving static files from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kambo WiFi Management System is active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
