import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";

let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbFilename = process.env.NODE_ENV === "production" || process.env.CLOUD_RUN === "true"
    ? "/tmp/database.sqlite"
    : "./database.sqlite";

  dbInstance = await open({
    filename: dbFilename,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await dbInstance.run("PRAGMA foreign_keys = ON;");

  // Create tables if they do not exist
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      speed_mbps INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      national_id TEXT NOT NULL,
      estate TEXT NOT NULL,
      house_number TEXT NOT NULL,
      gps_location TEXT,
      package_id INTEGER,
      monthly_price REAL NOT NULL,
      installation_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'suspended', 'offline')) NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      method TEXT CHECK(method IN ('M-Pesa', 'Cash', 'Bank')) NOT NULL,
      reference_number TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      problem TEXT NOT NULL,
      technician TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('Pending', 'Assigned', 'In Progress', 'Completed')) NOT NULL DEFAULT 'Pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      buying_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      date TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('Paid', 'Unpaid', 'Overdue')) NOT NULL DEFAULT 'Unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('Payment Due', 'Suspended Account', 'New Repair', 'Low Router Stock')) NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL DEFAULT 'Kambo WiFi',
      phone_number TEXT NOT NULL DEFAULT '0795 099525',
      mpesa_number TEXT NOT NULL DEFAULT '0795 099525',
      logo_url TEXT DEFAULT '',
      tax_rate REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'KES',
      dark_mode INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Seed Admin user if empty
  const userCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM users");
  if (userCount && userCount.count === 0) {
    const adminHash = await bcrypt.hash("admin123", 10);
    await dbInstance.run(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      ["admin", adminHash]
    );
    console.log("Database: Seeded admin user 'admin' with password 'admin123'.");
  }

  // Seed default Settings if empty
  const settingsCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM settings");
  if (settingsCount && settingsCount.count === 0) {
    await dbInstance.run(`
      INSERT INTO settings (business_name, phone_number, mpesa_number, logo_url, tax_rate, currency, dark_mode)
      VALUES ('Kambo WiFi', '0795 099525', '0795 099525', '', 16.0, 'KES', 0)
    `);
  }

  // Seed Packages if empty
  const packageCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM packages");
  if (packageCount && packageCount.count === 0) {
    await dbInstance.run("INSERT INTO packages (name, speed_mbps, price) VALUES (?, ?, ?)", ["Basic", 10, 1500]);
    await dbInstance.run("INSERT INTO packages (name, speed_mbps, price) VALUES (?, ?, ?)", ["Standard", 20, 2500]);
    await dbInstance.run("INSERT INTO packages (name, speed_mbps, price) VALUES (?, ?, ?)", ["Premium", 50, 3500]);
    await dbInstance.run("INSERT INTO packages (name, speed_mbps, price) VALUES (?, ?, ?)", ["Business", 100, 6000]);
    console.log("Database: Seeded 4 WiFi packages.");
  }

  // Seed 20 Demo Clients if empty
  const clientCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM clients");
  if (clientCount && clientCount.count === 0) {
    const packages = await dbInstance.all<{ id: number; price: number }>("SELECT id, price FROM packages");
    const demoClients = [
      { name: "John Kamau", phone: "0712345678", national_id: "33445566", estate: "Kahawa Sukari", house_number: "A12", gps: "-1.1834,36.9312", pkgIdx: 0, status: "active", notes: "Prefers morning maintenance", instDate: "2026-01-10" },
      { name: "Mary Atieno", phone: "0722987654", national_id: "28475629", estate: "Ruiru", house_number: "B4", gps: "-1.1450,36.9602", pkgIdx: 1, status: "active", notes: "", instDate: "2026-02-15" },
      { name: "David Mwangi", phone: "0733555222", national_id: "19283746", estate: "Thika Road", house_number: "C22", gps: "-1.2152,36.8920", pkgIdx: 2, status: "active", notes: "Payment on 5th", instDate: "2026-03-01" },
      { name: "Sarah Wambui", phone: "0701112223", national_id: "30495811", estate: "Githurai 44", house_number: "H10", gps: "-1.2001,36.9050", pkgIdx: 0, status: "active", notes: "No issues reported", instDate: "2026-01-20" },
      { name: "Peter Ochieng", phone: "0799000111", national_id: "22334455", estate: "Kahawa Sukari", house_number: "Z5", gps: "-1.1840,36.9330", pkgIdx: 3, status: "active", notes: "Business client, needs 99.9% uptime", instDate: "2025-11-15" },
      { name: "Grace Kiprop", phone: "0721234567", national_id: "29485731", estate: "Ruiru", house_number: "Flat 3D", gps: "-1.1432,36.9585", pkgIdx: 1, status: "suspended", notes: "Overdue payment", instDate: "2026-04-05" },
      { name: "James Ndwiga", phone: "0755443322", national_id: "27384950", estate: "Zimmerman", house_number: "E4", gps: "-1.2080,36.8970", pkgIdx: 0, status: "offline", notes: "Reported connection issue", instDate: "2026-05-12" },
      { name: "Lucy Muthoni", phone: "0788776655", national_id: "31425364", estate: "Thika Road", house_number: "Block F6", gps: "-1.2140,36.8945", pkgIdx: 1, status: "active", notes: "", instDate: "2026-02-28" },
      { name: "Bernard Langat", phone: "0711998877", national_id: "26485930", estate: "Kahawa West", house_number: "K12", gps: "-1.1890,36.8850", pkgIdx: 2, status: "active", notes: "Likes autoinvoicing", instDate: "2026-03-10" },
      { name: "Alice Chebet", phone: "0725334455", national_id: "32948576", estate: "Ruiru", house_number: "Villa 15", gps: "-1.1480,36.9630", pkgIdx: 0, status: "active", notes: "", instDate: "2026-01-05" },
      { name: "Robert Kariuki", phone: "0734667788", national_id: "24857693", estate: "Githurai 44", house_number: "G3", gps: "-1.2020,36.9080", pkgIdx: 1, status: "suspended", notes: "Arranged payment next week", instDate: "2026-03-25" },
      { name: "Evelyn Nekesa", phone: "0702445566", national_id: "31928374", estate: "Kahawa Sukari", house_number: "Y1", gps: "-1.1820,36.9290", pkgIdx: 2, status: "active", notes: "On standard automatic router reboot", instDate: "2025-12-01" },
      { name: "Michael Nduta", phone: "0791223344", national_id: "28374615", estate: "Zimmerman", house_number: "C12", gps: "-1.2110,36.8990", pkgIdx: 0, status: "active", notes: "", instDate: "2026-04-18" },
      { name: "Francis Mutua", phone: "0741223344", national_id: "29475630", estate: "Thika Road", house_number: "M5", gps: "-1.2170,36.8900", pkgIdx: 3, status: "active", notes: "Corporate account", instDate: "2026-02-10" },
      { name: "Nancy Wanjiku", phone: "0783112233", national_id: "30594827", estate: "Ruiru", house_number: "H20", gps: "-1.1410,36.9610", pkgIdx: 1, status: "active", notes: "", instDate: "2026-05-01" },
      { name: "George Omwamba", phone: "0795123456", national_id: "23847596", estate: "Kahawa Sukari", house_number: "B1", gps: "-1.1855,36.9315", pkgIdx: 0, status: "offline", notes: "Power supply cut", instDate: "2026-05-20" },
      { name: "Ruth Nyambura", phone: "0720443322", national_id: "21948576", estate: "Kahawa West", house_number: "N14", gps: "-1.1880,36.8830", pkgIdx: 1, status: "active", notes: "", instDate: "2026-03-15" },
      { name: "Kevin Kipkemboi", phone: "0718554433", national_id: "32485960", estate: "Zimmerman", house_number: "B12", gps: "-1.2090,36.8960", pkgIdx: 2, status: "active", notes: "Works remote", instDate: "2026-04-02" },
      { name: "Esther Akinyi", phone: "0708665544", national_id: "34958671", estate: "Githurai 44", house_number: "D9", gps: "-1.2015,36.9065", pkgIdx: 0, status: "active", notes: "", instDate: "2026-01-28" },
      { name: "Simon Maina", phone: "0729778899", national_id: "25849673", estate: "Kahawa Sukari", house_number: "P8", gps: "-1.1845,36.9340", pkgIdx: 1, status: "active", notes: "", instDate: "2026-02-12" }
    ];

    for (const cli of demoClients) {
      const pkg = packages[cli.pkgIdx];
      await dbInstance.run(`
        INSERT INTO clients (name, phone, national_id, estate, house_number, gps_location, package_id, monthly_price, installation_date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [cli.name, cli.phone, cli.national_id, cli.estate, cli.house_number, cli.gps, pkg.id, pkg.price, cli.instDate, cli.status, cli.notes]);
    }
    console.log("Database: Seeded 20 clients.");
  }

  // Seed Payments if empty
  const paymentCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM payments");
  if (paymentCount && paymentCount.count === 0) {
    const clients = await dbInstance.all<{ id: number; monthly_price: number }[]>("SELECT id, monthly_price FROM clients LIMIT 10");
    const paymentMethods = ["M-Pesa", "Cash", "Bank"] as const;
    const refs = ["MPESA_K1001", "CASH_102", "BANK_20394", "MPESA_K1002", "CASH_103", "MPESA_K1003", "BANK_20412", "MPESA_K1004", "MPESA_K1005", "CASH_104"];

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const method = paymentMethods[i % paymentMethods.length];
      const ref = refs[i];
      const daysAgo = i * 3 + 1;
      const dateStr = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      await dbInstance.run(`
        INSERT INTO payments (client_id, amount, date, method, reference_number)
        VALUES (?, ?, ?, ?, ?)
      `, [client.id, client.monthly_price, dateStr, method, ref]);

      // Seed corresponding paid invoices
      await dbInstance.run(`
        INSERT INTO invoices (client_id, invoice_number, amount, due_date, status)
        VALUES (?, ?, ?, ?, 'Paid')
      `, [client.id, "INV-2026-" + (1000 + i), client.monthly_price, dateStr]);
    }
    console.log("Database: Seeded 10 payments and invoices.");
  }

  // Seed unpaid/overdue invoices for client list consistency
  const invoiceCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM invoices");
  if (invoiceCount && invoiceCount.count <= 10) {
    const overdueClients = await dbInstance.all<{ id: number; monthly_price: number }[]>("SELECT id, monthly_price FROM clients WHERE status = 'suspended' LIMIT 3");
    for (let i = 0; i < overdueClients.length; i++) {
      const client = overdueClients[i];
      const pastDate = new Date(Date.now() - (15 + i * 5) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      await dbInstance.run(`
        INSERT INTO invoices (client_id, invoice_number, amount, due_date, status)
        VALUES (?, ?, ?, ?, 'Overdue')
      `, [client.id, "INV-2026-OD-" + (500 + i), client.monthly_price, pastDate]);
    }

    const unpaidClients = await dbInstance.all<{ id: number; monthly_price: number }[]>("SELECT id, monthly_price FROM clients WHERE status = 'active' LIMIT 3");
    for (let i = 0; i < unpaidClients.length; i++) {
      const client = unpaidClients[i];
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      await dbInstance.run(`
        INSERT INTO invoices (client_id, invoice_number, amount, due_date, status)
        VALUES (?, ?, ?, ?, 'Unpaid')
      `, [client.id, "INV-2026-UP-" + (600 + i), client.monthly_price, futureDate]);
    }
    console.log("Database: Seeded unpaid and overdue invoices.");
  }

  // Seed 10 Repairs if empty
  const repairCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM repairs");
  if (repairCount && repairCount.count === 0) {
    const clients = await dbInstance.all<{ id: number }[]>("SELECT id FROM clients LIMIT 10");
    const problems = [
      "WiFi dropping connection frequently",
      "No internet access but router shows green lights",
      "Very slow speed during peak hours",
      "Router won't power on",
      "Red light on LOS on the fiber modem",
      "Cable cut by estate developers",
      "Need help setting up secondary router extender",
      "Port forwarding requirements for business IP",
      "Password change assistance",
      "Poor coverage in upstairs bedroom"
    ];
    const techs = ["Alice Tech", "Bob Installer", "Charles Network", "Diana Field"];
    const statuses = ["Pending", "Assigned", "In Progress", "Completed"] as const;

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const prob = problems[i];
      const tech = techs[i % techs.length];
      const status = statuses[i % statuses.length];
      const dateStr = new Date(Date.now() - (i * 2) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      await dbInstance.run(`
        INSERT INTO repairs (client_id, problem, technician, date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [client.id, prob, tech, dateStr, status, "Seeded repair history task #" + i]);
    }
    console.log("Database: Seeded 10 repair tickets.");
  }

  // Seed 20 Router Products if empty
  const productCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM products");
  if (productCount && productCount.count === 0) {
    const defaultProducts = [
      { name: "TP-Link Archer C6 AC1200", brand: "TP-Link", stock: 12, buying: 2200, selling: 3500 },
      { name: "MikroTik hAP ac2 Dual-Band", brand: "MikroTik", stock: 8, buying: 6500, selling: 8500 },
      { name: "Ubiquiti UniFi U6 Lite AP", brand: "Ubiquiti", stock: 5, buying: 12000, selling: 15500 },
      { name: "TP-Link RE300 WiFi Extender", brand: "TP-Link", stock: 15, buying: 18000, selling: 25000 },
      { name: "Ethernet Cable CAT6 305m Roll", brand: "Generic", stock: 3, buying: 4500, selling: 7000 },
      { name: "Power Adapter 12V 1.5A Pin", brand: "Generic", stock: 40, buying: 200, selling: 500 },
      { name: "TP-Link Archer AX10 Wi-Fi 6", brand: "TP-Link", stock: 6, buying: 4500, selling: 6500 },
      { name: "MikroTik RB750Gr3 hEX Router", brand: "MikroTik", stock: 4, buying: 5200, selling: 7200 },
      { name: "Ubiquiti EdgeRouter X", brand: "Ubiquiti", stock: 2, buying: 6000, selling: 8500 },
      { name: "Tenda AC10 AC1200 Smart WiFi", brand: "Tenda", stock: 25, buying: 1800, selling: 3000 },
      { name: "Mercusys MW301R 300Mbps", brand: "Mercusys", stock: 18, buying: 900, selling: 1500 },
      { name: "Huawei EG8145V5 GPON ONU", brand: "Huawei", stock: 22, buying: 2500, selling: 4000 },
      { name: "Fiber Patch Cord SC/UPC-SC/APC", brand: "Generic", stock: 50, buying: 80, selling: 250 },
      { name: "SFP Module 1.25G 10km BiDi", brand: "Generic", stock: 10, buying: 800, selling: 1800 },
      { name: "D-Link DIR-842 AC1200", brand: "D-Link", stock: 7, buying: 2000, selling: 3200 },
      { name: "MikroTik hAP lite TC", brand: "MikroTik", stock: 14, buying: 2400, selling: 3500 },
      { name: "Ubiquiti UniFi Dream Router", brand: "Ubiquiti", stock: 1, buying: 28000, selling: 35000 },
      { name: "RJ45 Connectors Cat6 Pack-100", brand: "Generic", stock: 11, buying: 300, selling: 800 },
      { name: "POE Injector 24V 0.5A Gigabit", brand: "Ubiquiti", stock: 12, buying: 1000, selling: 1800 },
      { name: "Fiber Joint Box 4-Port Drop", brand: "Generic", stock: 9, buying: 400, selling: 1000 }
    ];

    for (const prod of defaultProducts) {
      await dbInstance.run(`
        INSERT INTO products (name, brand, stock, buying_price, selling_price)
        VALUES (?, ?, ?, ?, ?)
      `, [prod.name, prod.brand, prod.stock, prod.buying, prod.selling]);
    }
    console.log("Database: Seeded 20 router shop products.");
  }

  // Seed Sales if empty (to give products statistics)
  const salesCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM sales");
  if (salesCount && salesCount.count === 0) {
    const products = await dbInstance.all<{ id: number; selling_price: number }[]>("SELECT id, selling_price FROM products LIMIT 5");
    const dates = ["2026-06-20", "2026-06-21", "2026-06-22", "2026-06-23", "2026-06-24"];
    const buyers = ["James Gichuru", "Nairobi Academy", "Grace Nderitu", "Jane Rose", "Ruiru Library"];

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const qty = (i % 2) + 1;
      const total = prod.selling_price * qty;
      const dateStr = dates[i];
      const buyer = buyers[i];

      await dbInstance.run(`
        INSERT INTO sales (product_id, quantity, total_price, date, customer_name)
        VALUES (?, ?, ?, ?, ?)
      `, [prod.id, qty, total, dateStr, buyer]);

      // Deduct stock
      await dbInstance.run(`
        UPDATE products SET stock = stock - ? WHERE id = ?
      `, [qty, prod.id]);
    }
    console.log("Database: Seeded demo sales and decremented inventory stock.");
  }

  // Seed initial notifications if empty
  const notifCount = await dbInstance.get<{ count: number }>("SELECT COUNT(*) as count FROM notifications");
  if (notifCount && notifCount.count === 0) {
    await dbInstance.run(`
      INSERT INTO notifications (type, message, read)
      VALUES ('Low Router Stock', 'Ubiquiti UniFi Dream Router is low in stock (1 item left).', 0)
    `);
    await dbInstance.run(`
      INSERT INTO notifications (type, message, read)
      VALUES ('Suspended Account', 'Grace Kiprop (0721234567) has been suspended due to outstanding balance.', 0)
    `);
    await dbInstance.run(`
      INSERT INTO notifications (type, message, read)
      VALUES ('New Repair', 'New repair request raised: Cable cut by estate developers for James Ndwiga.', 0)
    `);
    await dbInstance.run(`
      INSERT INTO notifications (type, message, read)
      VALUES ('Payment Due', 'Bernard Langat payment is due in 3 days.', 0)
    `);
    console.log("Database: Seeded initial notifications.");
  }

  return dbInstance;
}
