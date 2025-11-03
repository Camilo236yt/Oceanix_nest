import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // ========== COUNTRIES ==========

  @Get('countries')
  @ApiOperation({ summary: 'Get all active countries' })
  @ApiResponse({ status: 200, description: 'List of countries' })
  async getAllCountries() {
    return await this.locationService.findAllCountries();
  }

  @Get('countries/:id')
  @ApiOperation({ summary: 'Get country by ID' })
  @ApiParam({ name: 'id', description: 'Country UUID' })
  @ApiResponse({ status: 200, description: 'Country details' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async getCountryById(@Param('id') id: string) {
    return await this.locationService.findCountryById(id);
  }

  @Get('countries/code/:code')
  @ApiOperation({ summary: 'Get country by ISO code' })
  @ApiParam({ name: 'code', description: 'Country ISO code (e.g., COL, USA, MEX)' })
  @ApiResponse({ status: 200, description: 'Country details' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async getCountryByCode(@Param('code') code: string) {
    return await this.locationService.findCountryByCode(code);
  }

  // ========== STATES/DEPARTMENTS ==========

  @Get('states')
  @ApiOperation({ summary: 'Get states/departments by country' })
  @ApiQuery({
    name: 'countryId',
    required: true,
    description: 'Country UUID to filter states'
  })
  @ApiResponse({ status: 200, description: 'List of states/departments' })
  async getStatesByCountry(@Query('countryId') countryId: string) {
    return await this.locationService.findStatesByCountry(countryId);
  }

  @Get('states/:id')
  @ApiOperation({ summary: 'Get state/department by ID' })
  @ApiParam({ name: 'id', description: 'State/Department UUID' })
  @ApiResponse({ status: 200, description: 'State/Department details' })
  @ApiResponse({ status: 404, description: 'State not found' })
  async getStateById(@Param('id') id: string) {
    return await this.locationService.findStateById(id);
  }

  // ========== CITIES ==========

  @Get('cities')
  @ApiOperation({ summary: 'Get cities by state/department' })
  @ApiQuery({
    name: 'stateId',
    required: true,
    description: 'State/Department UUID to filter cities'
  })
  @ApiResponse({ status: 200, description: 'List of cities' })
  async getCitiesByState(@Query('stateId') stateId: string) {
    return await this.locationService.findCitiesByState(stateId);
  }

  @Get('cities/:id')
  @ApiOperation({ summary: 'Get city by ID' })
  @ApiParam({ name: 'id', description: 'City UUID' })
  @ApiResponse({ status: 200, description: 'City details with state and country' })
  @ApiResponse({ status: 404, description: 'City not found' })
  async getCityById(@Param('id') id: string) {
    return await this.locationService.findCityById(id);
  }

  // ========== ADDRESSES (Protected endpoints) ==========

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createAddress(@Body() createAddressDto: CreateAddressDto) {
    return await this.locationService.createAddress(createAddressDto);
  }

  @Get('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address details with full location' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAddressById(@Param('id') id: string) {
    return await this.locationService.findAddressById(id);
  }

  @Put('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an address' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateAddress(
    @Param('id') id: string,
    @Body() updateAddressDto: Partial<CreateAddressDto>
  ) {
    return await this.locationService.updateAddress(id, updateAddressDto);
  }

  @Delete('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an address (soft delete)' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAddress(@Param('id') id: string) {
    await this.locationService.deleteAddress(id);
    return { message: 'Address deleted successfully' };
  }
}