ROLES = {
    "Super Admin": ["*"],
    "Plant Manager": ["read", "create", "update", "delete"],
    "Production Manager": ["read", "create", "update"],
    "Quality Manager": ["read", "create", "update"],
    "Maintenance Engineer": ["read", "create", "update"],
    "Operator": ["read", "create"],
    "Viewer": ["read"],
}