# Seed Data Documentation

Este módulo puebla la base de datos con datos iniciales para desarrollo y pruebas.

## Ejecución

```bash
npm run seed
```

## Datos Creados

### 1. Permisos (68 permisos globales)

Se crean todos los permisos del sistema de incidencias con su jerarquía:

- **Dashboard**: readDashboard, viewReports, exportReports
- **Incidencias**: manage, create, view, viewOwn, edit, editOwn, delete, assign, close, reopen
- **Categorías**: manage, create, edit, delete
- **Prioridades**: manage, create, edit, delete
- **Estados**: manage, create, edit, delete
- **Comentarios**: manage, create, edit, editOwn, delete, deleteOwn
- **Archivos**: manage, upload, download, delete
- **Usuarios**: manage, create, view, edit, delete
- **Roles**: manage, get, create, edit, delete, managePermissions
- **Notificaciones**: manage, send
- **Email**: manageQueue, manageVerification
- **Sistema**: manageRedis, manageSystem

### 2. Empresas (3 empresas)

| Empresa              | Subdomain        | Email                       | Teléfono     |
| -------------------- | ---------------- | --------------------------- | ------------ |
| TechCorp Solutions   | techcorp         | contact@techcorp.com        | +1234567890  |
| Global Services Inc  | globalservices   | info@globalservices.com     | +1234567891  |
| Innovation Labs      | innovationlabs   | hello@innovationlabs.com    | +1234567892  |

### 3. Roles (3 roles por empresa)

Cada empresa tiene 3 roles:

#### Rol 1: Administrador de Incidencias
**Permisos:**
- manageIncidents
- createIncidents
- viewIncidents
- editIncidents
- deleteIncidents
- assignIncidents
- closeIncidents
- reopenIncidents
- readDashboard

#### Rol 2: Administrador de Usuarios
**Permisos:**
- manageUsers
- createUsers
- viewUsers
- editUsers
- deleteUsers
- manageRoles
- getRoles
- createRoles
- editRoles
- deleteRoles
- readDashboard

#### Rol 3: Visualizador de Incidencias
**Permisos:**
- viewOwnIncidents
- createComments
- editOwnComments
- deleteOwnComments
- readDashboard

### 4. Usuarios (3 usuarios por empresa)

**Contraseña común para todos:** `Password123!`

#### Por cada empresa:

**Usuario 1: Carlos Rodríguez**
- Email: `carlos.rodriguez@{subdomain}.com`
- Rol: Administrador de Incidencias
- Teléfono: +1234567800

**Usuario 2: María González**
- Email: `maria.gonzalez@{subdomain}.com`
- Rol: Administrador de Usuarios
- Teléfono: +1234567801

**Usuario 3: Juan Pérez**
- Email: `juan.perez@{subdomain}.com`
- Rol: Visualizador de Incidencias
- Teléfono: +1234567802

## Ejemplos de Login

### TechCorp Solutions

```bash
# Admin de Incidencias
POST /auth/login
{
  "email": "carlos.rodriguez@techcorp.com",
  "password": "Password123!",
  "subdomain": "techcorp"
}

# Admin de Usuarios
POST /auth/login
{
  "email": "maria.gonzalez@techcorp.com",
  "password": "Password123!",
  "subdomain": "techcorp"
}

# Visualizador
POST /auth/login
{
  "email": "juan.perez@techcorp.com",
  "password": "Password123!",
  "subdomain": "techcorp"
}
```

### Global Services Inc

```bash
# Admin de Incidencias
POST /auth/login
{
  "email": "carlos.rodriguez@globalservices.com",
  "password": "Password123!",
  "subdomain": "globalservices"
}

# Admin de Usuarios
POST /auth/login
{
  "email": "maria.gonzalez@globalservices.com",
  "password": "Password123!",
  "subdomain": "globalservices"
}

# Visualizador
POST /auth/login
{
  "email": "juan.perez@globalservices.com",
  "password": "Password123!",
  "subdomain": "globalservices"
}
```

### Innovation Labs

```bash
# Admin de Incidencias
POST /auth/login
{
  "email": "carlos.rodriguez@innovationlabs.com",
  "password": "Password123!",
  "subdomain": "innovationlabs"
}

# Admin de Usuarios
POST /auth/login
{
  "email": "maria.gonzalez@innovationlabs.com",
  "password": "Password123!",
  "subdomain": "innovationlabs"
}

# Visualizador
POST /auth/login
{
  "email": "juan.perez@innovationlabs.com",
  "password": "Password123!",
  "subdomain": "innovationlabs"
}
```

## Notas Importantes

- El seed verifica si ya existen datos antes de crearlos
- Si los permisos ya existen, los carga y los usa para crear roles
- Si las empresas ya existen, no crea nada más
- Todos los usuarios tienen `isActive: true` y `isEmailVerified: true`
- Los usuarios son de tipo `EMPLOYEE`
- Las contraseñas están hasheadas con bcrypt (10 rounds)
