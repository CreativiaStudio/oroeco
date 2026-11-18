-- ==============================================================================
-- GIOIELLERIA OROECO — STANDALONE DEDICATED DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- ==============================================================================
-- Client: Gioielleria Oroeco (Renato) — Corso Ettore Padovano, Pagani (SA)
-- Architecture: Fully isolated dedicated database instance.
-- Total Database Isolation Mandate:
--   - This schema is 100% standalone and decoupled from Creativia Studio.
--   - Run this script in the Supabase SQL Editor once the dedicated Oroeco
--     instance is provisioned by the agency administrator.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. DOMAINS & ENUMS
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE oroeco_product_category AS ENUM (
        'gioielli',
        'orologi',
        'accessori',
        'casa',
        'natale'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE oroeco_sale_type AS ENUM (
        'scontrino_rt',
        'fattura_sdi',
        'ricevuta_fiscale',
        'reso'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE oroeco_payment_method AS ENUM (
        'cash',
        'card',
        'split',
        'online'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE oroeco_inventory_movement AS ENUM (
        'pos_instore_sale',
        'ecom_online_sale',
        'restock',
        'manual_adjustment',
        'return_restock',
        'return_damaged'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 3. CORE TABLES (9 ISOLATED ENTITIES)
-- ==============================================================================

-- 3.1 BRANDS (I 18 Marchi Ufficiali Oroeco)
CREATE TABLE IF NOT EXISTS oroeco_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Italia',
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 CATEGORIES (Alberatura Excel)
CREATE TABLE IF NOT EXISTS oroeco_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    parent_category oroeco_product_category NOT NULL,
    description TEXT,
    hero_image TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 PRODUCTS (Catalogo Luxury con Attributi Orafi & Barcode EAN-13)
CREATE TABLE IF NOT EXISTS oroeco_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand_id UUID REFERENCES oroeco_brands(id) ON DELETE SET NULL,
    brand_name TEXT NOT NULL,
    category oroeco_product_category NOT NULL,
    subcategory TEXT NOT NULL,
    subcategory_label TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= price),
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 22.00 CHECK (vat_rate >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    barcode TEXT NOT NULL UNIQUE, -- EAN-13 hardware barcode scanner lookup
    sku TEXT NOT NULL UNIQUE,     -- Articolo fornitore
    short_description TEXT,
    description TEXT,
    images TEXT[] NOT NULL DEFAULT '{}',
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb, -- metal, carats, stones, movement, weightGr...
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_christmas BOOLEAN NOT NULL DEFAULT false,
    supplier_cost NUMERIC(10, 2),
    markup_multiplier NUMERIC(5, 2) DEFAULT 2.2,
    approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending_approval', 'rejected')),
    supplier_name TEXT,
    invoice_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.4 CUSTOMERS (Anagrafica B2C / B2B per Fattura Elettronica SDI)
CREATE TABLE IF NOT EXISTS oroeco_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_type TEXT NOT NULL DEFAULT 'b2c' CHECK (customer_type IN ('b2c', 'b2b')),
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    fiscal_code TEXT,      -- Codice Fiscale (16 chars privato / 11 chars persona giuridica)
    vat_number TEXT,       -- Partita IVA (11 cifre)
    sdi_code TEXT DEFAULT '0000000', -- Codice Destinatario SDI (7 caratteri)
    pec TEXT,              -- Posta Elettronica Certificata
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    province TEXT,
    country TEXT NOT NULL DEFAULT 'IT',
    notes TEXT,
    total_sales_count INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT customer_identifier_check CHECK (
        (customer_type = 'b2c' AND (fiscal_code IS NOT NULL OR email IS NOT NULL)) OR
        (customer_type = 'b2b' AND (vat_number IS NOT NULL OR fiscal_code IS NOT NULL))
    )
);

-- 3.5 SALES (Transazioni Punto Cassa & E-Commerce)
CREATE TABLE IF NOT EXISTS oroeco_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number TEXT NOT NULL UNIQUE, -- e.g. ORC-20261007-0042
    sale_type oroeco_sale_type NOT NULL DEFAULT 'scontrino_rt',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_mode TEXT NOT NULL DEFAULT 'none' CHECK (discount_mode IN ('none', 'percent', 'amount')),
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_value >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    taxable_base NUMERIC(10, 2) NOT NULL CHECK (taxable_base >= 0), -- Imponibile (Totale / 1.22)
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 22.00,
    vat_amount NUMERIC(10, 2) NOT NULL CHECK (vat_amount >= 0),    -- IVA 22% scorporata
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method oroeco_payment_method NOT NULL DEFAULT 'cash',
    cash_tendered NUMERIC(10, 2) DEFAULT 0.00,
    cash_change NUMERIC(10, 2) DEFAULT 0.00,
    operator_name TEXT NOT NULL DEFAULT 'Renato', -- 'Renato' | 'Carmela' | 'Maria'
    customer_id UUID REFERENCES oroeco_customers(id) ON DELETE SET NULL,
    lottery_code TEXT, -- Lotteria degli scontrini (8 caratteri)
    rt_receipt_number TEXT,
    rt_z_report TEXT,
    sdi_identifier TEXT,
    sdi_status TEXT DEFAULT 'pending' CHECK (sdi_status IN ('pending', 'sent', 'accepted', 'rejected', 'not_applicable')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6 SALE ITEMS (Righe Articolo dello Scontrino / Fattura)
CREATE TABLE IF NOT EXISTS oroeco_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES oroeco_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES oroeco_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (line_discount >= 0),
    line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 22.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.7 INVENTORY TRANSACTIONS (Registro Movimentazioni & Scalo Giacenze)
CREATE TABLE IF NOT EXISTS oroeco_inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES oroeco_products(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    product_name TEXT NOT NULL,
    change_quantity INTEGER NOT NULL, -- Negative for sales, positive for restocks
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    movement_type oroeco_inventory_movement NOT NULL,
    reference_id TEXT, -- e.g. sale_number or DDT number
    operator TEXT NOT NULL DEFAULT 'Renato',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.8 AURA RT RECEIPTS (Coda & Log Comandi Registratore Telematico Ditron LAN)
CREATE TABLE IF NOT EXISTS oroeco_aura_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES oroeco_sales(id) ON DELETE CASCADE,
    operator TEXT NOT NULL DEFAULT 'Renato',
    raw_commands TEXT[] NOT NULL, -- Sequenza Ditron ECR ('VEND...', 'SUBT', 'CHIUS...')
    payment_tender INTEGER NOT NULL DEFAULT 1, -- 1=Contanti, 2=Carta
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'simulated', 'error', 'queued')),
    response_code TEXT,
    device_ip TEXT DEFAULT '192.168.1.150',
    device_port INTEGER DEFAULT 9100,
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.9 AUDIT LOG (Tracciabilità Operazioni Banco & Sicurezza)
CREATE TABLE IF NOT EXISTS oroeco_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'POS', 'INVENTORY', 'AUTH', 'SDI', 'RT'
    action TEXT NOT NULL,   -- 'SALE_COMPLETED', 'STOCK_DEPLETED', 'DISCOUNT_APPLIED'
    operator TEXT NOT NULL DEFAULT 'Renato',
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_oroeco_products_barcode ON oroeco_products(barcode);
CREATE INDEX IF NOT EXISTS idx_oroeco_products_sku ON oroeco_products(sku);
CREATE INDEX IF NOT EXISTS idx_oroeco_products_slug ON oroeco_products(slug);
CREATE INDEX IF NOT EXISTS idx_oroeco_products_category ON oroeco_products(category);
CREATE INDEX IF NOT EXISTS idx_oroeco_products_subcategory ON oroeco_products(subcategory);
CREATE INDEX IF NOT EXISTS idx_oroeco_products_brand_id ON oroeco_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_oroeco_products_instock ON oroeco_products(in_stock);
CREATE INDEX IF NOT EXISTS idx_oroeco_products_created_at ON oroeco_products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oroeco_sales_sale_number ON oroeco_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_oroeco_sales_created_at ON oroeco_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oroeco_sales_operator ON oroeco_sales(operator_name);
CREATE INDEX IF NOT EXISTS idx_oroeco_sales_customer ON oroeco_sales(customer_id);

CREATE INDEX IF NOT EXISTS idx_oroeco_sale_items_sale_id ON oroeco_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_oroeco_sale_items_product_id ON oroeco_sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_oroeco_inventory_prod ON oroeco_inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_oroeco_inventory_created_at ON oroeco_inventory_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oroeco_aura_sale_id ON oroeco_aura_receipts(sale_id);
CREATE INDEX IF NOT EXISTS idx_oroeco_customers_fc ON oroeco_customers(fiscal_code);
CREATE INDEX IF NOT EXISTS idx_oroeco_customers_piva ON oroeco_customers(vat_number);

-- ==============================================================================
-- 5. TRIGGERS: UPDATED_AT TIMESTAMP
-- ==============================================================================
CREATE OR REPLACE FUNCTION oroeco_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_oroeco_brands_updated_at ON oroeco_brands;
CREATE TRIGGER trg_oroeco_brands_updated_at
    BEFORE UPDATE ON oroeco_brands
    FOR EACH ROW EXECUTE FUNCTION oroeco_update_timestamp();

DROP TRIGGER IF EXISTS trg_oroeco_categories_updated_at ON oroeco_categories;
CREATE TRIGGER trg_oroeco_categories_updated_at
    BEFORE UPDATE ON oroeco_categories
    FOR EACH ROW EXECUTE FUNCTION oroeco_update_timestamp();

DROP TRIGGER IF EXISTS trg_oroeco_products_updated_at ON oroeco_products;
CREATE TRIGGER trg_oroeco_products_updated_at
    BEFORE UPDATE ON oroeco_products
    FOR EACH ROW EXECUTE FUNCTION oroeco_update_timestamp();

DROP TRIGGER IF EXISTS trg_oroeco_customers_updated_at ON oroeco_customers;
CREATE TRIGGER trg_oroeco_customers_updated_at
    BEFORE UPDATE ON oroeco_customers
    FOR EACH ROW EXECUTE FUNCTION oroeco_update_timestamp();

-- ==============================================================================
-- 6. ATOMIC STORED PROCEDURE: RECORD POS SALE & DEPLETE INVENTORY
-- ==============================================================================
CREATE OR REPLACE FUNCTION oroeco_record_pos_sale(
    p_sale_number TEXT,
    p_sale_type TEXT,
    p_operator TEXT,
    p_payment_method TEXT,
    p_subtotal NUMERIC,
    p_discount_mode TEXT,
    p_discount_value NUMERIC,
    p_discount_amount NUMERIC,
    p_taxable_base NUMERIC,
    p_vat_amount NUMERIC,
    p_total_amount NUMERIC,
    p_cash_tendered NUMERIC,
    p_cash_change NUMERIC,
    p_items JSONB, -- Array of item objects
    p_customer_id UUID DEFAULT NULL,
    p_lottery_code TEXT DEFAULT NULL,
    p_rt_receipt_number TEXT DEFAULT NULL,
    p_sdi_identifier TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_barcode TEXT;
    v_sku TEXT;
    v_name TEXT;
    v_brand TEXT;
    v_price NUMERIC;
    v_qty INTEGER;
    v_line_total NUMERIC;
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- 1. Inserimento record vendita principale
    INSERT INTO oroeco_sales (
        sale_number,
        sale_type,
        status,
        subtotal,
        discount_mode,
        discount_value,
        discount_amount,
        taxable_base,
        vat_rate,
        vat_amount,
        total_amount,
        payment_method,
        cash_tendered,
        cash_change,
        operator_name,
        customer_id,
        lottery_code,
        rt_receipt_number,
        sdi_identifier
    ) VALUES (
        p_sale_number,
        p_sale_type::oroeco_sale_type,
        'completed',
        p_subtotal,
        p_discount_mode,
        p_discount_value,
        p_discount_amount,
        p_taxable_base,
        22.00,
        p_vat_amount,
        p_total_amount,
        p_payment_method::oroeco_payment_method,
        p_cash_tendered,
        p_cash_change,
        p_operator,
        p_customer_id,
        p_lottery_code,
        p_rt_receipt_number,
        p_sdi_identifier
    )
    RETURNING id INTO v_sale_id;

    -- 2. Iterazione su ogni articolo venduto per scalare la giacenza con row lock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_barcode    := v_item->>'barcode';
        v_sku        := v_item->>'sku';
        v_name       := v_item->>'name';
        v_brand      := COALESCE(v_item->>'brand', 'Oroeco');
        v_price      := (v_item->>'price')::NUMERIC;
        v_qty        := COALESCE((v_item->>'quantity')::INTEGER, 1);
        v_line_total := v_price * v_qty;

        -- Risoluzione prodotto per barcode o SKU
        SELECT id, stock_quantity
        INTO v_product_id, v_current_stock
        FROM oroeco_products
        WHERE barcode = v_barcode OR sku = v_sku
        FOR UPDATE;

        IF v_product_id IS NOT NULL THEN
            v_new_stock := GREATEST(0, v_current_stock - v_qty);

            -- Aggiornamento stock prodotto
            UPDATE oroeco_products
            SET
                stock_quantity = v_new_stock,
                in_stock = (v_new_stock > 0),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_product_id;

            -- Registrazione movimentazione magazzino
            INSERT INTO oroeco_inventory_transactions (
                product_id,
                sku,
                barcode,
                product_name,
                change_quantity,
                previous_quantity,
                new_quantity,
                movement_type,
                reference_id,
                operator,
                notes
            ) VALUES (
                v_product_id,
                v_sku,
                v_barcode,
                v_name,
                -v_qty,
                v_current_stock,
                v_new_stock,
                'pos_instore_sale',
                p_sale_number,
                p_operator,
                'Vendita banco registrata da operatore ' || p_operator
            );
        END IF;

        -- Inserimento riga scontrino
        INSERT INTO oroeco_sale_items (
            sale_id,
            product_id,
            product_name,
            brand_name,
            sku,
            barcode,
            unit_price,
            quantity,
            line_discount,
            line_total,
            vat_rate
        ) VALUES (
            v_sale_id,
            v_product_id,
            v_name,
            v_brand,
            v_sku,
            v_barcode,
            v_price,
            v_qty,
            0.00,
            v_line_total,
            22.00
        );
    END LOOP;

    -- 3. Log di audit
    INSERT INTO oroeco_audit_log (
        category,
        action,
        operator,
        details
    ) VALUES (
        'POS',
        'SALE_COMPLETED',
        p_operator,
        jsonb_build_object(
            'sale_id', v_sale_id,
            'sale_number', p_sale_number,
            'total_amount', p_total_amount,
            'payment_method', p_payment_method
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'sale_number', p_sale_number,
        'total_amount', p_total_amount
    );
END;
$$;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE oroeco_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE oroeco_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE oroeco_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE oroeco_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE oroeco_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE oroeco_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE oroeco_inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oroeco_aura_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oroeco_audit_log ENABLE ROW LEVEL SECURITY;

-- 7.1 Politiche di lettura pubblica per il catalogo e-commerce
CREATE POLICY "Public read access for active brands"
    ON oroeco_brands FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public read access for active categories"
    ON oroeco_categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public read access for products"
    ON oroeco_products FOR SELECT
    USING (true);

-- 7.2 Politiche di accesso per lo staff autenticato (Renato, Carmela, Maria)
CREATE POLICY "Staff all access to brands"
    ON oroeco_brands FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Staff all access to categories"
    ON oroeco_categories FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Staff all access to products"
    ON oroeco_products FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Staff all access to customers"
    ON oroeco_customers FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Staff all access to sales"
    ON oroeco_sales FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Staff all access to sale items"
    ON oroeco_sale_items FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Staff all access to inventory transactions"
    ON oroeco_inventory_transactions FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Staff all access to aura receipts"
    ON oroeco_aura_receipts FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Staff read access to audit log"
    ON oroeco_audit_log FOR SELECT
    TO authenticated
    USING (true);
