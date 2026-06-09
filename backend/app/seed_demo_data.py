from database import SessionLocal
from models import (
    Product,
    Inventory,
    WorkCenter,
    ProductionOrder,
    QualityCheck,
    WasteRecord,
    DowntimeRecord,
    Supplier,
    Customer,
    PurchaseOrder,
    SalesOrder,
    MaintenanceWorkOrder,
    BatchTrace,
)


db = SessionLocal()


def seed_demo_data():
    # Products
    products = [
        Product(sku="SALAD-250G", name="Mixed Salad 250g", category="Finished Goods", unit="pack", cost_price=1.2, selling_price=2.5, reorder_level=300),
        Product(sku="SALAD-500G", name="Family Salad 500g", category="Finished Goods", unit="pack", cost_price=2.1, selling_price=4.2, reorder_level=200),
        Product(sku="LETTUCE-1KG", name="Fresh Lettuce 1kg", category="Raw Material", unit="kg", cost_price=0.8, selling_price=1.5, reorder_level=500),
        Product(sku="CARROT-1KG", name="Carrot 1kg", category="Raw Material", unit="kg", cost_price=0.6, selling_price=1.2, reorder_level=400),
        Product(sku="PACK-BOX", name="Packaging Box", category="Packaging", unit="pcs", cost_price=0.15, selling_price=0.3, reorder_level=1000),
    ]

    for product in products:
        if not db.query(Product).filter(Product.sku == product.sku).first():
            db.add(product)

    db.commit()

    # Suppliers
    suppliers = [
        Supplier(name="FreshFarm Ltd", contact_person="Marco Rossi", email="freshfarm@example.com", phone="+390411111111", address="Venice, Italy"),
        Supplier(name="Green Valley Foods", contact_person="Laura Bianchi", email="greenvalley@example.com", phone="+390422222222", address="Padova, Italy"),
        Supplier(name="AgriPack Solutions", contact_person="Ahmed Conteh", email="agripack@example.com", phone="+390433333333", address="Treviso, Italy"),
    ]

    for supplier in suppliers:
        if not db.query(Supplier).filter(Supplier.name == supplier.name).first():
            db.add(supplier)

    db.commit()

    # Customers
    customers = [
        Customer(name="Conad", contact_person="Giulia Moretti", email="conad@example.com", phone="+390444444444", address="Mestre, Italy"),
        Customer(name="Lidl Italia", contact_person="Paolo Ricci", email="lidl@example.com", phone="+390455555555", address="Verona, Italy"),
        Customer(name="Carrefour", contact_person="Sara Galli", email="carrefour@example.com", phone="+390466666666", address="Milan, Italy"),
    ]

    for customer in customers:
        if not db.query(Customer).filter(Customer.name == customer.name).first():
            db.add(customer)

    db.commit()

    # Work Centers
    work_centers = [
        WorkCenter(name="Packaging Line A", description="Primary salad packaging line", status="Running"),
        WorkCenter(name="Packaging Line B", description="Secondary packaging line", status="Idle"),
        WorkCenter(name="Mixing Station", description="Vegetable mixing and preparation", status="Running"),
        WorkCenter(name="Washing Line", description="Raw vegetable washing line", status="Maintenance"),
    ]

    for wc in work_centers:
        if not db.query(WorkCenter).filter(WorkCenter.name == wc.name).first():
            db.add(wc)

    db.commit()

    products_db = db.query(Product).all()
    suppliers_db = db.query(Supplier).all()
    customers_db = db.query(Customer).all()
    work_centers_db = db.query(WorkCenter).all()

    # Inventory
    for product in products_db:
        if not db.query(Inventory).filter(Inventory.product_id == product.id).first():
            quantity = 150 if product.sku in ["LETTUCE-1KG", "PACK-BOX"] else 800
            db.add(
                Inventory(
                    product_id=product.id,
                    warehouse="Main Warehouse",
                    quantity=quantity,
                    reserved_quantity=50,
                    min_stock=product.reorder_level,
                    max_stock=2000,
                )
            )

    db.commit()

    # Production Orders
    production_orders = [
        ProductionOrder(order_number="PO-2026-001", product_id=products_db[0].id, work_center_id=work_centers_db[0].id, target_quantity=1000, produced_quantity=650, priority="High", status="In Progress"),
        ProductionOrder(order_number="PO-2026-002", product_id=products_db[1].id, work_center_id=work_centers_db[1].id, target_quantity=600, produced_quantity=0, priority="Normal", status="Planned"),
        ProductionOrder(order_number="PO-2026-003", product_id=products_db[0].id, work_center_id=work_centers_db[2].id, target_quantity=1200, produced_quantity=1200, priority="Normal", status="Completed"),
    ]

    for order in production_orders:
        if not db.query(ProductionOrder).filter(ProductionOrder.order_number == order.order_number).first():
            db.add(order)

    db.commit()

    orders_db = db.query(ProductionOrder).all()

    # Quality Checks
    quality_checks = [
        QualityCheck(production_order_id=orders_db[0].id, check_type="Visual Inspection", result="Pass", inspector_name="Quality Team A", defects_count=2, notes="Minor defects detected"),
        QualityCheck(production_order_id=orders_db[1].id, check_type="Weight Check", result="Warning", inspector_name="Quality Team B", defects_count=5, corrective_action="Adjust filling machine"),
        QualityCheck(production_order_id=orders_db[2].id, check_type="Final Inspection", result="Fail", inspector_name="Quality Team A", defects_count=12, corrective_action="Review packaging seal"),
    ]

    for check in quality_checks:
        db.add(check)

    # Waste Records
    waste_records = [
        WasteRecord(product_id=products_db[0].id, quantity=25, reason="Packaging damage", recorded_by="Operator A"),
        WasteRecord(product_id=products_db[2].id, quantity=40, reason="Raw material spoilage", recorded_by="Operator B"),
        WasteRecord(product_id=products_db[1].id, quantity=15, reason="Weight mismatch", recorded_by="Operator C"),
    ]

    for waste in waste_records:
        db.add(waste)

    # Downtime
    downtime_records = [
        DowntimeRecord(work_center_id=work_centers_db[0].id, reason="Machine cleaning", duration_minutes=35, recorded_by="Technician A"),
        DowntimeRecord(work_center_id=work_centers_db[1].id, reason="Material delay", duration_minutes=75, recorded_by="Supervisor B"),
        DowntimeRecord(work_center_id=work_centers_db[3].id, reason="Maintenance", duration_minutes=120, recorded_by="Technician C"),
    ]

    for downtime in downtime_records:
        db.add(downtime)

    # Purchase Orders
    purchase_orders = [
        PurchaseOrder(supplier_id=suppliers_db[0].id, product_id=products_db[2].id, quantity=1000, unit_price=0.75, status="Ordered"),
        PurchaseOrder(supplier_id=suppliers_db[1].id, product_id=products_db[3].id, quantity=800, unit_price=0.55, status="Pending"),
        PurchaseOrder(supplier_id=suppliers_db[2].id, product_id=products_db[4].id, quantity=3000, unit_price=0.12, status="Received"),
    ]

    for po in purchase_orders:
        db.add(po)

    # Sales Orders
    sales_orders = [
        SalesOrder(customer_id=customers_db[0].id, product_id=products_db[0].id, quantity=700, unit_price=2.5, status="Confirmed"),
        SalesOrder(customer_id=customers_db[1].id, product_id=products_db[1].id, quantity=400, unit_price=4.2, status="Delivered"),
        SalesOrder(customer_id=customers_db[2].id, product_id=products_db[0].id, quantity=900, unit_price=2.45, status="Pending"),
    ]

    for so in sales_orders:
        db.add(so)

    # Maintenance
    maintenance_orders = [
        MaintenanceWorkOrder(work_center_id=work_centers_db[0].id, title="Inspect sealing unit", description="Check heat sealing temperature", priority="High", status="Open", assigned_to="Technician A"),
        MaintenanceWorkOrder(work_center_id=work_centers_db[3].id, title="Replace washing pump", description="Pump vibration detected", priority="Urgent", status="In Progress", assigned_to="Technician C"),
    ]

    for mo in maintenance_orders:
        db.add(mo)

    # Traceability
    batch_records = [
        BatchTrace(batch_number="BATCH-2026-001", product_id=products_db[0].id, supplier_id=suppliers_db[0].id, quantity=1000, status="Active", notes="Fresh salad production batch"),
        BatchTrace(batch_number="BATCH-2026-002", product_id=products_db[2].id, supplier_id=suppliers_db[1].id, quantity=500, status="Consumed", notes="Raw lettuce batch"),
    ]

    for batch in batch_records:
        if not db.query(BatchTrace).filter(BatchTrace.batch_number == batch.batch_number).first():
            db.add(batch)

    db.commit()
    print("Demo data created successfully.")


if __name__ == "__main__":
    seed_demo_data()
    db.close()