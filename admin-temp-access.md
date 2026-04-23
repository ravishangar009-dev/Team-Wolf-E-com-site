---
name: Admin Temp Access System
description: Temp admins assigned by main admin via user ID can manage products; all changes tracked in product_audit_log table
type: feature
---
- Main admin grants temp access via Admin Temp Access page using user UUID
- Temp admins use the /store-admin portal to manage products (add, edit, delete)
- Every product change is logged to `product_audit_log` table with action, product name, user ID, and details
- Activity Log page at /admin/activity-log shows all changes (blockchain-like audit trail)
- Temp access can be revoked instantly by removing from the admin panel
- Uses existing `store_admins` table under the hood (single-shop model)
