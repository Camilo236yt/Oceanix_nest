

export enum ValidPermission {
    // Dashboard
    readDashboard = 'read_dashboard',
    viewReports = 'view_reports',
    exportReports = 'export_reports',

    // Incidents Management
    manageIncidents = 'manage_incidents',
    createIncidents = 'create_incidents',
    viewIncidents = 'view_incidents',
    viewOwnIncidents = 'view_own_incidents',
    editIncidents = 'edit_incidents',
    editOwnIncidents = 'edit_own_incidents',
    deleteIncidents = 'delete_incidents',
    assignIncidents = 'assign_incidents',
    closeIncidents = 'close_incidents',
    reopenIncidents = 'reopen_incidents',

    // Incident Categories
    manageCategories = 'manage_categories',
    createCategories = 'create_categories',
    editCategories = 'edit_categories',
    deleteCategories = 'delete_categories',

    // Incident Priorities
    managePriorities = 'manage_priorities',
    createPriorities = 'create_priorities',
    editPriorities = 'edit_priorities',
    deletePriorities = 'delete_priorities',

    // Incident Status
    manageStatuses = 'manage_statuses',
    createStatuses = 'create_statuses',
    editStatuses = 'edit_statuses',
    deleteStatuses = 'delete_statuses',

    // Comments
    manageComments = 'manage_comments',
    createComments = 'create_comments',
    editComments = 'edit_comments',
    editOwnComments = 'edit_own_comments',
    deleteComments = 'delete_comments',
    deleteOwnComments = 'delete_own_comments',

    // Attachments/Files
    manageFiles = 'manage_files',
    uploadFiles = 'upload_files',
    downloadFiles = 'download_files',
    deleteFiles = 'delete_files',

    // Users & Employees Management
    manageUsers = 'manage_users',
    createUsers = 'create_users',
    viewUsers = 'view_users',
    editUsers = 'edit_users',
    deleteUsers = 'delete_users',

    // Roles & Permissions
    manageRoles = 'manage_roles',
    getRoles = 'get_roles',
    createRoles = 'create_roles',
    editRoles = 'edit_roles',
    deleteRoles = 'delete_roles',
    managePermissions = 'manage_permissions',

    // Notifications
    manageNotifications = 'manage_notifications',
    sendNotifications = 'send_notifications',

    // Email Management
    manageEmailQueue = 'manage_email_queue',
    manageEmailVerification = 'manage_email_verification',

    // System Administration
    manageRedis = 'manage_redis',
    manageSystem = 'manage_system',

    // Enterprise Configuration & Verification
    manageEnterpriseConfig = 'manage_enterprise_config',
    uploadEnterpriseDocuments = 'upload_enterprise_documents',
    verifyEnterprises = 'verify_enterprises',
    approveDocuments = 'approve_documents',
}