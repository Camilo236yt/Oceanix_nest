import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password: string;
}
