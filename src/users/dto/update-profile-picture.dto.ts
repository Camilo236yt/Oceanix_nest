import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfilePictureDto {
    @ApiProperty({
        description: 'URL of the profile picture',
        example: 'https://lh3.googleusercontent.com/a/example-photo',
    })
    @IsNotEmpty()
    @IsString()
    @IsUrl({}, { message: 'La URL de la imagen no es válida' })
    profilePicture: string;
}
