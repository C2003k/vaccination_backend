export const ROLES = {
  ADMIN: "admin",
  HEALTH_WORKER: "health_worker",
  HOSPITAL_STAFF: "hospital_staff",
  MOTHER: "mother",
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    "users:read",
    "users:write",
    "users:delete",
    "vaccines:read",
    "vaccines:write",
    "vaccines:delete",
    "children:read",
    "children:write",
    "children:delete",
    "records:read",
    "records:write",
    "records:delete",
    "reports:read",
    "reports:write",
    "hospitals:read",
    "hospitals:write",
    "hospitals:delete",
    "stock:read",
    "stock:write",
    "stock:delete",
    "coverage:read",
    "coverage:write",
    "coverage:delete",
  ],
  [ROLES.HEALTH_WORKER]: [
    "users:read",
    "vaccines:read",
    "children:read",
    "children:write",
    "records:read",
    "records:write",
    "reports:read",
    "reports:write",
    "mothers:read", // Can view assigned mothers
    "defaulters:read", // Can view defaulters list
    "schedule:read",
    "schedule:write",
  ],
  [ROLES.HOSPITAL_STAFF]: [
    // Added this section
    "vaccines:read",
    "stock:read",
    "stock:write",
    "records:read",
    "records:write",
    "children:read",
    "users:read", // Can view patient/users data
    "appointments:read",
    "appointments:write",
    "coverage:read",
    "coverage:write",
    "hospitals:read", // Can view their hospital data
    "reports:read",
    "reports:write",
  ],
  [ROLES.MOTHER]: [
    "children:read",
    "children:write",
    "records:read",
    "schedule:read",
    "reminders:read",
    "profile:read",
    "profile:write",
  ],
};
