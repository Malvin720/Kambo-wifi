import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDatabase } from "./database";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "kambo_wifi_secret_key_2026_secure";

// Authentication middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    (req as any).user = user;
    next();
  });
}

// Helper to create notifications
async function createSystemNotification(type: "Payment Due" | "Suspended Account" | "New Repair" | "Low Router Stock", message: string) {
  try {
    const db = await getDatabase();
    await db.run(
      "INSERT INTO notifications (type, message, read) VALUES (?, ?, 0)",
      [type, message]
    );
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

// ==========================================
// 1. AUTH ROUTES
// ==========================================

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    const db = await getDatabase();
    const user = await db.get<{ id: number; username: string; password_hash: string }>(
      "SELECT id, username, password_hash FROM users WHERE username = ?",
      [username]
    );

    if (!user) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me (Get current user)
router.get("/auth/me", authenticateToken, async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  res.json({ user: { id: reqUser.id, username: reqUser.username } });
});

// POST /api/auth/change-password
router.post("/auth/change-password", authenticateToken, async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const reqUser = (req as any).user;

  if (!oldPassword || !newPassword) {
    res.status(400).json({ error: "Old and new passwords are required" });
    return;
  }

  try {
    const db = await getDatabase();
    const user = await db.get<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE id = ?",
      [reqUser.id]
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      res.status(400).json({ error: "Incorrect old password" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.run("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, reqUser.id]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 2. CLIENT ROUTES
// ==========================================

// GET /api/clients (with search & filtering)
router.get("/clients", authenticateToken, async (req: Request, res: Response) => {
  const { search, status, package_id } = req.query;

  try {
    const db = await getDatabase();
    let query = `
      SELECT c.*, p.name as package_name, p.speed_mbps as package_speed
      FROM clients c
      LEFT JOIN packages p ON c.package_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.national_id LIKE ? OR c.estate LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (package_id) {
      query += ` AND c.package_id = ?`;
      params.push(Number(package_id));
    }

    query += ` ORDER BY c.id DESC`;

    const clients = await db.all(query, params);
    res.json(clients);
  } catch (error) {
    console.error("Get clients error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/clients
router.post("/clients", authenticateToken, async (req: Request, res: Response) => {
  const {
    name,
    phone,
    national_id,
    estate,
    house_number,
    gps_location,
    package_id,
    monthly_price,
    installation_date,
    status,
    notes,
  } = req.body;

  if (!name || !phone || !national_id || !estate || !house_number || !monthly_price || !installation_date) {
    res.status(400).json({ error: "Required fields are missing" });
    return;
  }

  try {
    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO clients (
        name, phone, national_id, estate, house_number, gps_location,
        package_id, monthly_price, installation_date, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      phone,
      national_id,
      estate,
      house_number,
      gps_location || "",
      package_id ? Number(package_id) : null,
      Number(monthly_price),
      installation_date,
      status || "active",
      notes || "",
    ]);

    const newClientId = result.lastID;

    // Generate an initial invoice
    const invNumber = `INV-2026-${1000 + (newClientId || 0)}`;
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    await db.run(`
      INSERT INTO invoices (client_id, invoice_number, amount, due_date, status)
      VALUES (?, ?, ?, ?, 'Unpaid')
    `, [newClientId, invNumber, Number(monthly_price), dueDate]);

    res.status(201).json({ id: newClientId, message: "Client created successfully" });
  } catch (error) {
    console.error("Create client error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/clients/:id
router.put("/clients/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    phone,
    national_id,
    estate,
    house_number,
    gps_location,
    package_id,
    monthly_price,
    installation_date,
    status,
    notes,
  } = req.body;

  if (!name || !phone || !national_id || !estate || !house_number || !monthly_price || !installation_date) {
    res.status(400).json({ error: "Required fields are missing" });
    return;
  }

  try {
    const db = await getDatabase();
    
    // Fetch old status to see if status changed to suspended
    const oldClient = await db.get<{ status: string; name: string }>(
      "SELECT status, name FROM clients WHERE id = ?",
      [id]
    );

    await db.run(`
      UPDATE clients SET
        name = ?, phone = ?, national_id = ?, estate = ?, house_number = ?, gps_location = ?,
        package_id = ?, monthly_price = ?, installation_date = ?, status = ?, notes = ?
      WHERE id = ?
    `, [
      name,
      phone,
      national_id,
      estate,
      house_number,
      gps_location,
      package_id ? Number(package_id) : null,
      Number(monthly_price),
      installation_date,
      status,
      notes,
      id,
    ]);

    // Handle system notifications if status changed
    if (oldClient && oldClient.status !== status) {
      if (status === "suspended") {
        await createSystemNotification("Suspended Account", `Client ${oldClient.name} (${phone}) has been suspended.`);
      }
    }

    res.json({ message: "Client updated successfully" });
  } catch (error) {
    console.error("Update client error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/clients/:id
router.delete("/clients/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const db = await getDatabase();
    await db.run("DELETE FROM clients WHERE id = ?", [id]);
    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Delete client error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 3. WIFI PACKAGE ROUTES
// ==========================================

// GET /api/packages
router.get("/packages", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const pkgs = await db.all("SELECT * FROM packages ORDER BY price ASC");
    res.json(pkgs);
  } catch (error) {
    console.error("Get packages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/packages
router.post("/packages", authenticateToken, async (req: Request, res: Response) => {
  const { name, speed_mbps, price } = req.body;

  if (!name || !speed_mbps || !price) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    const db = await getDatabase();
    const result = await db.run(
      "INSERT INTO packages (name, speed_mbps, price) VALUES (?, ?, ?)",
      [name, Number(speed_mbps), Number(price)]
    );
    res.status(201).json({ id: result.lastID, message: "Package created successfully" });
  } catch (error) {
    console.error("Create package error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/packages/:id
router.put("/packages/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, speed_mbps, price } = req.body;

  if (!name || !speed_mbps || !price) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    const db = await getDatabase();
    await db.run(
      "UPDATE packages SET name = ?, speed_mbps = ?, price = ? WHERE id = ?",
      [name, Number(speed_mbps), Number(price), id]
    );
    res.json({ message: "Package updated successfully" });
  } catch (error) {
    console.error("Update package error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/packages/:id
router.delete("/packages/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const db = await getDatabase();
    // Check if package is in use
    const clientUse = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM clients WHERE package_id = ?",
      [id]
    );
    if (clientUse && clientUse.count > 0) {
      res.status(400).json({ error: "Cannot delete package: it is assigned to active clients" });
      return;
    }

    await db.run("DELETE FROM packages WHERE id = ?", [id]);
    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error("Delete package error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 4. PAYMENT ROUTES
// ==========================================

// GET /api/payments
router.get("/payments", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const payments = await db.all(`
      SELECT p.*, c.name as client_name, c.phone as client_phone
      FROM payments p
      JOIN clients c ON p.client_id = c.id
      ORDER BY p.id DESC
    `);
    res.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payments
router.post("/payments", authenticateToken, async (req: Request, res: Response) => {
  const { client_id, amount, date, method, reference_number } = req.body;

  if (!client_id || !amount || !date || !method || !reference_number) {
    res.status(400).json({ error: "All payment fields are required" });
    return;
  }

  try {
    const db = await getDatabase();
    
    // Insert payment
    await db.run(`
      INSERT INTO payments (client_id, amount, date, method, reference_number)
      VALUES (?, ?, ?, ?, ?)
    `, [Number(client_id), Number(amount), date, method, reference_number]);

    // Reactivate client if they were suspended or offline
    await db.run(
      "UPDATE clients SET status = 'active' WHERE id = ?",
      [Number(client_id)]
    );

    // Update corresponding invoices to Paid (update the most overdue/unpaid invoice for this client)
    const unpaidInvoice = await db.get<{ id: number }>(
      "SELECT id FROM invoices WHERE client_id = ? AND status != 'Paid' ORDER BY due_date ASC LIMIT 1",
      [client_id]
    );

    if (unpaidInvoice) {
      await db.run("UPDATE invoices SET status = 'Paid' WHERE id = ?", [unpaidInvoice.id]);
    } else {
      // Create a paid invoice record just for tracking
      const invNum = `INV-PAY-${Date.now().toString().slice(-6)}`;
      await db.run(`
        INSERT INTO invoices (client_id, invoice_number, amount, due_date, status)
        VALUES (?, ?, ?, ?, 'Paid')
      `, [client_id, invNum, Number(amount), date]);
    }

    res.status(201).json({ message: "Payment recorded successfully" });
  } catch (error: any) {
    console.error("Create payment error:", error);
    if (error.message && error.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Reference number already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// GET /api/payments/overdue (Invoices with unpaid status or suspended clients)
router.get("/payments/overdue", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const overdue = await db.all(`
      SELECT i.*, c.name as client_name, c.phone as client_phone, c.estate, c.house_number
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.status = 'Overdue' OR (i.status = 'Unpaid' AND i.due_date < date('now'))
      ORDER BY i.due_date ASC
    `);
    res.json(overdue);
  } catch (error) {
    console.error("Get overdue error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payments/stk-push (M-Pesa STK simulation)
router.post("/payments/stk-push", authenticateToken, async (req: Request, res: Response) => {
  const { client_id, phone, amount } = req.body;

  if (!client_id || !phone || !amount) {
    res.status(400).json({ error: "Client ID, Phone, and Amount are required" });
    return;
  }

  try {
    const db = await getDatabase();
    const client = await db.get<{ name: string }>("SELECT name FROM clients WHERE id = ?", [client_id]);

    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    // Generate a mock M-Pesa receipt
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mockRef = "LQD"; // Safaricom common start
    for (let i = 0; i < 7; i++) {
      mockRef += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Simulate database insertion (after a small processing delay on frontend, we'll write it directly now)
    await db.run(`
      INSERT INTO payments (client_id, amount, date, method, reference_number)
      VALUES (?, ?, ?, 'M-Pesa', ?)
    `, [Number(client_id), Number(amount), todayStr, mockRef]);

    // Update client status to active
    await db.run("UPDATE clients SET status = 'active' WHERE id = ?", [Number(client_id)]);

    // Update invoice status
    const unpaidInvoice = await db.get<{ id: number }>(
      "SELECT id FROM invoices WHERE client_id = ? AND status != 'Paid' ORDER BY due_date ASC LIMIT 1",
      [client_id]
    );

    if (unpaidInvoice) {
      await db.run("UPDATE invoices SET status = 'Paid' WHERE id = ?", [unpaidInvoice.id]);
    } else {
      const invNum = `INV-MPESA-${mockRef}`;
      await db.run(`
        INSERT INTO invoices (client_id, invoice_number, amount, due_date, status)
        VALUES (?, ?, ?, ?, 'Paid')
      `, [client_id, invNum, Number(amount), todayStr]);
    }

    res.json({
      success: true,
      reference_number: mockRef,
      message: `STK Push simulated successfully. KES ${amount} received from ${client.name} (${phone}). Client status reactivated.`,
    });
  } catch (error) {
    console.error("STK Push simulation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 5. REPAIR ROUTES
// ==========================================

// GET /api/repairs
router.get("/repairs", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const tickets = await db.all(`
      SELECT r.*, c.name as client_name, c.phone as client_phone, c.estate, c.house_number
      FROM repairs r
      JOIN clients c ON r.client_id = c.id
      ORDER BY r.id DESC
    `);
    res.json(tickets);
  } catch (error) {
    console.error("Get repairs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/repairs
router.post("/repairs", authenticateToken, async (req: Request, res: Response) => {
  const { client_id, problem, technician, date, status, notes } = req.body;

  if (!client_id || !problem || !technician || !date) {
    res.status(400).json({ error: "Missing required repair fields" });
    return;
  }

  try {
    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO repairs (client_id, problem, technician, date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      Number(client_id),
      problem,
      technician,
      date,
      status || "Pending",
      notes || "",
    ]);

    const client = await db.get<{ name: string }>("SELECT name FROM clients WHERE id = ?", [client_id]);
    const clientName = client ? client.name : "Unknown Client";

    await createSystemNotification(
      "New Repair",
      `New repair ticket created for ${clientName}: "${problem}" assigned to ${technician}.`
    );

    res.status(201).json({ id: result.lastID, message: "Repair ticket created successfully" });
  } catch (error) {
    console.error("Create repair error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/repairs/:id
router.put("/repairs/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { client_id, problem, technician, date, status, notes } = req.body;

  if (!client_id || !problem || !technician || !date || !status) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const db = await getDatabase();
    await db.run(`
      UPDATE repairs SET
        client_id = ?, problem = ?, technician = ?, date = ?, status = ?, notes = ?
      WHERE id = ?
    `, [Number(client_id), problem, technician, date, status, notes || "", id]);

    res.json({ message: "Repair ticket updated successfully" });
  } catch (error) {
    console.error("Update repair error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/repairs/:id
router.delete("/repairs/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const db = await getDatabase();
    await db.run("DELETE FROM repairs WHERE id = ?", [id]);
    res.json({ message: "Repair ticket deleted successfully" });
  } catch (error) {
    console.error("Delete repair error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 6. ROUTER SHOP / PRODUCT ROUTES
// ==========================================

// GET /api/products
router.get("/products", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const products = await db.all("SELECT * FROM products ORDER BY stock ASC");
    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/products
router.post("/products", authenticateToken, async (req: Request, res: Response) => {
  const { name, brand, stock, buying_price, selling_price } = req.body;

  if (!name || !brand || stock === undefined || !buying_price || !selling_price) {
    res.status(400).json({ error: "All product fields are required" });
    return;
  }

  try {
    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO products (name, brand, stock, buying_price, selling_price)
      VALUES (?, ?, ?, ?, ?)
    `, [name, brand, Number(stock), Number(buying_price), Number(selling_price)]);

    if (Number(stock) < 3) {
      await createSystemNotification(
        "Low Router Stock",
        `Product "${name}" is low in stock (${stock} units left).`
      );
    }

    res.status(201).json({ id: result.lastID, message: "Product created successfully" });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/products/:id
router.put("/products/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, brand, stock, buying_price, selling_price } = req.body;

  if (!name || !brand || stock === undefined || !buying_price || !selling_price) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    const db = await getDatabase();
    await db.run(`
      UPDATE products SET
        name = ?, brand = ?, stock = ?, buying_price = ?, selling_price = ?
      WHERE id = ?
    `, [name, brand, Number(stock), Number(buying_price), Number(selling_price), id]);

    if (Number(stock) < 3) {
      await createSystemNotification(
        "Low Router Stock",
        `Product "${name}" is low in stock (${stock} units left).`
      );
    }

    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/products/:id
router.delete("/products/:id", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const db = await getDatabase();
    await db.run("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 7. ROUTER SHOP SALES ROUTES
// ==========================================

// GET /api/sales
router.get("/sales", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const sales = await db.all(`
      SELECT s.*, p.name as product_name, p.brand as product_brand
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.id DESC
    `);
    res.json(sales);
  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sales (Deduct stock automatically)
router.post("/sales", authenticateToken, async (req: Request, res: Response) => {
  const { product_id, quantity, total_price, date, customer_name } = req.body;

  if (!product_id || !quantity || !total_price || !date || !customer_name) {
    res.status(400).json({ error: "All sale fields are required" });
    return;
  }

  try {
    const db = await getDatabase();
    const product = await db.get<{ name: string; stock: number }>(
      "SELECT name, stock FROM products WHERE id = ?",
      [product_id]
    );

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (product.stock < Number(quantity)) {
      res.status(400).json({ error: `Insufficient stock. Only ${product.stock} items available.` });
      return;
    }

    // Insert sale
    const result = await db.run(`
      INSERT INTO sales (product_id, quantity, total_price, date, customer_name)
      VALUES (?, ?, ?, ?, ?)
    `, [Number(product_id), Number(quantity), Number(total_price), date, customer_name]);

    // Update stock
    const newStock = product.stock - Number(quantity);
    await db.run(
      "UPDATE products SET stock = ? WHERE id = ?",
      [newStock, product_id]
    );

    // If stock goes below threshold, notify!
    if (newStock < 3) {
      await createSystemNotification(
        "Low Router Stock",
        `Inventory alert: ${product.name} stock has fallen to ${newStock} units following a sale to ${customer_name}.`
      );
    }

    res.status(201).json({ id: result.lastID, message: "Sale recorded and stock reduced successfully" });
  } catch (error) {
    console.error("Record sale error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 8. REPORTS ROUTE
// ==========================================

router.get("/reports", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();

    // 1. Revenue Summaries
    // Daily
    const dailyRevenue = await db.get<{ total: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE date = date('now')
    `);
    // Weekly (past 7 days)
    const weeklyRevenue = await db.get<{ total: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE date >= date('now', '-7 days')
    `);
    // Monthly (current calendar month)
    const monthlyRevenue = await db.get<{ total: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `);
    // Yearly (current calendar year)
    const yearlyRevenue = await db.get<{ total: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y', date) = strftime('%Y', 'now')
    `);

    // 2. Top Paying Clients (by total payment sum)
    const topClients = await db.all(`
      SELECT c.id, c.name, c.phone, COUNT(p.id) as payment_count, SUM(p.amount) as total_paid
      FROM clients c
      JOIN payments p ON p.client_id = c.id
      GROUP BY c.id
      ORDER BY total_paid DESC
      LIMIT 5
    `);

    // 3. Outstanding Balances (unpaid and overdue invoices)
    const outstandingBalances = await db.get<{ total: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status != 'Paid'
    `);

    // Individual outstanding clients
    const outstandingClients = await db.all(`
      SELECT c.name, c.phone, COUNT(i.id) as invoice_count, SUM(i.amount) as total_due
      FROM clients c
      JOIN invoices i ON i.client_id = c.id
      WHERE i.status != 'Paid'
      GROUP BY c.id
      ORDER BY total_due DESC
      LIMIT 10
    `);

    // 4. Router Sales Summary
    const routerSales = await db.all(`
      SELECT p.name as product_name, SUM(s.quantity) as items_sold, SUM(s.total_price) as revenue,
             SUM(s.quantity * p.buying_price) as buying_cost
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY p.id
      ORDER BY items_sold DESC
    `);

    // 5. Repair Reports (summarized count by status)
    const repairStats = await db.all(`
      SELECT status, COUNT(*) as count FROM repairs GROUP BY status
    `);

    res.json({
      revenue: {
        daily: dailyRevenue?.total || 0,
        weekly: weeklyRevenue?.total || 0,
        monthly: monthlyRevenue?.total || 0,
        yearly: yearlyRevenue?.total || 0,
      },
      topClients,
      outstanding: {
        total: outstandingBalances?.total || 0,
        clients: outstandingClients,
      },
      routerSales: routerSales.map((sale: any) => ({
        ...sale,
        profit: sale.revenue - sale.buying_cost,
      })),
      repairStats,
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 9. SETTINGS ROUTE
// ==========================================

router.get("/settings", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const settings = await db.get("SELECT * FROM settings ORDER BY id DESC LIMIT 1");
    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/settings", authenticateToken, async (req: Request, res: Response) => {
  const { business_name, phone_number, mpesa_number, logo_url, tax_rate, currency, dark_mode } = req.body;

  try {
    const db = await getDatabase();
    const existing = await db.get("SELECT id FROM settings ORDER BY id DESC LIMIT 1");

    if (existing) {
      await db.run(`
        UPDATE settings SET
          business_name = ?, phone_number = ?, mpesa_number = ?,
          logo_url = ?, tax_rate = ?, currency = ?, dark_mode = ?
        WHERE id = ?
      `, [
        business_name,
        phone_number,
        mpesa_number,
        logo_url || "",
        Number(tax_rate),
        currency || "KES",
        dark_mode ? 1 : 0,
        existing.id
      ]);
    } else {
      await db.run(`
        INSERT INTO settings (business_name, phone_number, mpesa_number, logo_url, tax_rate, currency, dark_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        business_name,
        phone_number,
        mpesa_number,
        logo_url || "",
        Number(tax_rate),
        currency || "KES",
        dark_mode ? 1 : 0
      ]);
    }

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 10. NOTIFICATION ROUTES
// ==========================================

router.get("/notifications", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const notifs = await db.all("SELECT * FROM notifications ORDER BY id DESC");
    res.json(notifs);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/notifications/:id/read", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const db = await getDatabase();
    await db.run("UPDATE notifications SET read = 1 WHERE id = ?", [id]);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Read notification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications/clear", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    await db.run("DELETE FROM notifications");
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ==========================================
// 11. GENERAL DASHBOARD STATS ROUTE
// ==========================================

router.get("/dashboard-stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();

    // Clients status counts
    const totalClients = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM clients");
    const activeClients = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM clients WHERE status = 'active'");
    const suspendedClients = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM clients WHERE status = 'suspended'");
    const offlineClients = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM clients WHERE status = 'offline'");

    // Total Revenue (monthly)
    const monthlyRevenue = await db.get<{ total: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `);

    // Pending Repairs count
    const pendingRepairs = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM repairs WHERE status != 'Completed'");

    // Low stock items count (stock < 3)
    const routerStockAlerts = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE stock < 3");

    // Recent payments (limit 5)
    const recentPayments = await db.all(`
      SELECT p.*, c.name as client_name
      FROM payments p
      JOIN clients c ON p.client_id = c.id
      ORDER BY p.id DESC
      LIMIT 5
    `);

    // Recent activities: merged logs of payments, repairs, and client signups
    const signupLogs = await db.all(`
      SELECT 'signup' as type, name || ' signed up from ' || estate as message, created_at as date
      FROM clients
      ORDER BY id DESC
      LIMIT 5
    `);

    const paymentLogs = await db.all(`
      SELECT 'payment' as type, 'Payment of KES ' || amount || ' received from ' || c.name as message, p.created_at as date
      FROM payments p
      JOIN clients c ON p.client_id = c.id
      ORDER BY p.id DESC
      LIMIT 5
    `);

    const repairLogs = await db.all(`
      SELECT 'repair' as type, 'New repair issue: "' || problem || '" for ' || c.name as message, r.created_at as date
      FROM repairs r
      JOIN clients c ON r.client_id = c.id
      ORDER BY r.id DESC
      LIMIT 5
    `);

    const recentActivities = [
      ...signupLogs,
      ...paymentLogs,
      ...repairLogs,
    ]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    res.json({
      summary: {
        totalClients: totalClients?.count || 0,
        activeClients: activeClients?.count || 0,
        suspendedClients: suspendedClients?.count || 0,
        offlineClients: offlineClients?.count || 0,
        monthlyRevenue: monthlyRevenue?.total || 0,
        pendingRepairs: pendingRepairs?.count || 0,
        lowStockAlerts: routerStockAlerts?.count || 0,
      },
      recentPayments,
      recentActivities,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
