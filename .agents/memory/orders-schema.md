---
name: Customer Orders Table Schema
description: The correct table name and key columns for orders in this project.
---

## Table name
`customer_orders` — NOT `orders`, NOT `purchase_orders`

## Key columns
- id, customer_name, customer_email, customer_phone, customer_company
- total_amount (numeric)
- status: 'pending' | 'in_progress' | 'in-progress' | 'processing' | 'completed' | 'cancelled' | 'delayed'
- agency_id → references agency_settings.id (NOT agency_subdomains)
- created_at, updated_at, notes

## Related tables
- customer_order_items: id, order_id (FK to customer_orders), service_name, service_description, price, quantity
- agency_settings: id, user_id, agency_name, ...

## Why
The table name "customer_orders" is non-obvious; using "orders" will silently return no data. The agency link goes through agency_settings.id (not user_id or subdomain id).
