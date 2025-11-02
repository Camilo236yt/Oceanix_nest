import { applyDecorators, UseGuards } from "@nestjs/common";
import { ValidPermission } from "../interfaces/valid-permission";
import { AuthGuard } from "@nestjs/passport";
import { UserPermissionGuard } from "../guard/user-permission/user-permission.guard";
import { PermissionProtected } from "./permission-protected.decorator";

export function Auth(...permissions: ValidPermission[]) {
  return applyDecorators(
    PermissionProtected(...permissions),
    UseGuards(AuthGuard('jwt'), UserPermissionGuard)
  );
}