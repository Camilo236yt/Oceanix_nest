import { Controller, Get, Put, Delete, Body, Param, ParseEnumPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserPreferencesService } from './user-preferences.service';
import { UpdateProviderStatusDto, UpdateProviderConfigDto, ProviderResponseDto } from './dto';
import { ProviderType } from './enums';
import { Auth, GetUser } from '../auth/decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('User Preferences')
@Controller('user-preferences')
@Auth()
@ApiBearerAuth()
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get('notifications/providers')
  @ApiOperation({
    summary: 'Get all notification providers configuration',
    description: 'Returns all notification providers (EMAIL, WEBSOCKET, TELEGRAM, WHATSAPP) with their status and configuration for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Providers retrieved successfully',
    type: [ProviderResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getNotificationProviders(@GetUser() user: User): Promise<ProviderResponseDto[]> {
    return this.userPreferencesService.getNotificationProviders(user.id);
  }

  @Get('notifications/providers/:providerType')
  @ApiOperation({
    summary: 'Get specific notification provider configuration',
    description: 'Returns configuration for a specific notification provider',
  })
  @ApiParam({
    name: 'providerType',
    enum: ProviderType,
    description: 'Type of notification provider',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider retrieved successfully',
    type: ProviderResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProvider(
    @GetUser() user: User,
    @Param('providerType', new ParseEnumPipe(ProviderType)) providerType: ProviderType,
  ): Promise<ProviderResponseDto> {
    return this.userPreferencesService.getProvider(user.id, providerType);
  }

  @Put('notifications/providers/:providerType/status')
  @ApiOperation({
    summary: 'Enable or disable a notification provider',
    description: 'Activates or deactivates a notification provider. Provider must be configured before enabling.',
  })
  @ApiParam({
    name: 'providerType',
    enum: ProviderType,
    description: 'Type of notification provider',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider status updated successfully',
    type: ProviderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Provider requires configuration before enabling',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateProviderStatus(
    @GetUser() user: User,
    @Param('providerType', new ParseEnumPipe(ProviderType)) providerType: ProviderType,
    @Body() dto: UpdateProviderStatusDto,
  ): Promise<ProviderResponseDto> {
    return this.userPreferencesService.updateProviderStatus(user.id, providerType, dto);
  }

  @Put('notifications/providers/:providerType/config')
  @ApiOperation({
    summary: 'Configure a notification provider',
    description: 'Updates provider configuration (e.g., chatId for Telegram, phoneNumber for WhatsApp)',
  })
  @ApiParam({
    name: 'providerType',
    enum: ProviderType,
    description: 'Type of notification provider',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider configured successfully',
    type: ProviderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid configuration',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateProviderConfig(
    @GetUser() user: User,
    @Param('providerType', new ParseEnumPipe(ProviderType)) providerType: ProviderType,
    @Body() dto: UpdateProviderConfigDto,
  ): Promise<ProviderResponseDto> {
    return this.userPreferencesService.updateProviderConfig(user.id, providerType, dto);
  }

  @Delete('notifications/providers/:providerType')
  @ApiOperation({
    summary: 'Remove provider configuration',
    description: 'Disables the provider and clears its configuration',
  })
  @ApiParam({
    name: 'providerType',
    enum: ProviderType,
    description: 'Type of notification provider',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider removed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async removeProvider(
    @GetUser() user: User,
    @Param('providerType', new ParseEnumPipe(ProviderType)) providerType: ProviderType,
  ): Promise<{ message: string }> {
    await this.userPreferencesService.removeProvider(user.id, providerType);
    return { message: `Provider ${providerType} removed successfully` };
  }
}
