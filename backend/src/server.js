import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import adminRoutes from "./routes/admin.js";
import mpesaRoutes from "./routes/mpesa.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true, service: "loansync-backend" }));

app.use("/api/admin", adminRoutes);
app.use("/api/mpesa", mpesaRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`LoanSync backend running on http://localhost:${PORT}`);
});