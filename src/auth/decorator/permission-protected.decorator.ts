import { SetMetadata } from "@nestjs/common";
import { ValidPermission } from "../interfaces/valid-permission";


export const META_PERMISSIONS = "permissions";

export const PermissionProtected = ( ...args:ValidPermission[] ) => {



    return SetMetadata(META_PERMISSIONS, args);
}