import { applyDecorators, UseGuards } from "@nestjs/common";
import { ValidPermission } from "../interfaces/valid-permission";
import { AuthGuard } from "@nestjs/passport";
import { UserPermissionGuard, TenantGuard } from "../guards";
import { PermissionProtected } from "./permission-protected.decorator";

/**
 * Combined authentication and authorization decorator.
 * Applies guards in the following order:
 * 1. JwtAuthGuard - Validates JWT token and loads user
 * 2. TenantGuard - Validates multitenant context (SUPER_ADMIN bypass)
 * 3. UserPermissionGuard - Validates user has required permissions
 *
 * @param permissions - Optional permissions required to access the endpoint
 */
export function Auth(...permissions: ValidPermission[]) {
  return applyDecorators(
    PermissionProtected(...permissions),
    UseGuards(AuthGuard('jwt'), TenantGuard, UserPermissionGuard)
  );
}