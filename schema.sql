-- D1 SQLite Schema for Viemma OS
-- Uses flat JSON strings where appropriate to minimize relational overhead.

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);

DROP TABLE IF EXISTS agents;
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS clients;
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    country TEXT,
    type TEXT,
    tags TEXT, -- JSON array of tags
    assistance TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS bookings;
CREATE TABLE bookings (
    id TEXT PRIMARY KEY,
    ref TEXT UNIQUE NOT NULL,
    client_id TEXT,
    agent_id TEXT,
    consultant TEXT,
    trip_type TEXT,
    start_date DATE,
    end_date DATE,
    pax INTEGER DEFAULT 2,
    
    -- Store nested, non-query-critical structured data as JSON TEXT for D1 optimization
    guests_json TEXT,       -- JSON array of guests
    logistics_json TEXT,    -- JSON object of transfers & cars
    rooming_json TEXT,      -- JSON array of room allocations
    itinerary_json TEXT,    -- JSON array of timeline events
    finance_json TEXT,      -- JSON object of costs, margins, exchange rates
    extras_json TEXT,       -- JSON array of special add-ons
    
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(client_id) REFERENCES clients(id),
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);
CREATE INDEX idx_bookings_ref ON bookings(ref);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Initial Seeding
INSERT INTO users (id, email, password_hash, role) 
VALUES ('usr_superadmin_01', 'your-email@gmail.com', 'CHANGE_ME_ON_LAUNCH', 'superadmin');
