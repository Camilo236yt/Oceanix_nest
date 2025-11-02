import { IsEmail, IsString, Matches } from "class-validator";

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
            message: 'The password must have a Uppercase, lowercase letter and a number'
        }
    )
    password: string;

    @IsString()
    name: string;

    @IsString()
    lastName: string;

    @IsString()
    @Matches(/^\d+$/, { message: 'this field must be a number' })
    phoneNumber: string;
}