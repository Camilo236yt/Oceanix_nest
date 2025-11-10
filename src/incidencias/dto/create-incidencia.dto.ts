import { IsEnum, IsString, MinLength } from "class-validator";
import { incidenciaStatus } from "./enum/status-incidencias.enum";

export class CreateIncidenciaDto {
    @IsString()
    @MinLength(3)
    name: string;
    @IsString()
    description: string;
    @IsEnum(incidenciaStatus)
    status: incidenciaStatus;
    @IsString()
    photoUrl?: string;
    @IsString()
    ProducReferenceId: string;
   
   


}

