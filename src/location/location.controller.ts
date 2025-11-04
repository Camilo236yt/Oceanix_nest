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
  @ApiOperation({
    summary: 'Get all active countries',
    description: 'Returns a list of all active countries with basic information (name, code, ISO2, phone code, currency, region)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of countries retrieved successfully',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Colombia',
          code: 'COL',
          iso2: 'CO',
          phoneCode: '+57',
          currency: 'COP',
          region: 'Americas'
        }
      ]
    }
  })
  async getAllCountries() {
    return await this.locationService.findAllCountries();
  }

  @Get('countries/:id')
  @ApiOperation({
    summary: 'Get country by ID',
    description: 'Returns detailed information about a specific country'
  })
  @ApiParam({
    name: 'id',
    description: 'Country UUID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 200,
    description: 'Country details retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Colombia',
        code: 'COL',
        iso2: 'CO',
        phoneCode: '+57',
        currency: 'COP',
        capital: 'Bogotá',
        region: 'Americas',
        subregion: 'South America'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async getCountryById(@Param('id') id: string) {
    return await this.locationService.findCountryById(id);
  }

  @Get('countries/code/:code')
  @ApiOperation({
    summary: 'Get country by ISO code',
    description: 'Returns country information using ISO3 code (e.g., COL, USA, MEX)'
  })
  @ApiParam({
    name: 'code',
    description: 'Country ISO3 code',
    example: 'COL'
  })
  @ApiResponse({
    status: 200,
    description: 'Country details retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async getCountryByCode(@Param('code') code: string) {
    return await this.locationService.findCountryByCode(code);
  }

  // ========== STATES/DEPARTMENTS ==========

  @Get('states')
  @ApiOperation({
    summary: 'Get states/departments by country',
    description: 'Returns all states/departments for a specific country'
  })
  @ApiQuery({
    name: 'countryId',
    required: true,
    description: 'Country UUID to filter states',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({
    status: 200,
    description: 'List of states/departments retrieved successfully',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Cundinamarca',
          code: 'CUN',
          type: 'Department',
          countryId: '550e8400-e29b-41d4-a716-446655440000'
        }
      ]
    }
  })
  async getStatesByCountry(@Query('countryId') countryId: string) {
    return await this.locationService.findStatesByCountry(countryId);
  }

  @Get('states/:id')
  @ApiOperation({
    summary: 'Get state/department by ID',
    description: 'Returns detailed information about a specific state/department'
  })
  @ApiParam({
    name: 'id',
    description: 'State/Department UUID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @ApiResponse({ status: 200, description: 'State/Department details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'State not found' })
  async getStateById(@Param('id') id: string) {
    return await this.locationService.findStateById(id);
  }

  // ========== CITIES ==========

  @Get('cities')
  @ApiOperation({
    summary: 'Get cities by state/department',
    description: 'Returns all cities for a specific state/department. Results are ordered alphabetically.'
  })
  @ApiQuery({
    name: 'stateId',
    required: true,
    description: 'State/Department UUID to filter cities',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @ApiResponse({
    status: 200,
    description: 'List of cities retrieved successfully',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Bogotá',
          postalCode: '110111',
          stateId: '550e8400-e29b-41d4-a716-446655440001'
        }
      ]
    }
  })
  async getCitiesByState(@Query('stateId') stateId: string) {
    return await this.locationService.findCitiesByState(stateId);
  }

  @Get('cities/:id')
  @ApiOperation({
    summary: 'Get city by ID',
    description: 'Returns detailed information about a specific city'
  })
  @ApiParam({
    name: 'id',
    description: 'City UUID',
    example: '550e8400-e29b-41d4-a716-446655440002'
  })
  @ApiResponse({ status: 200, description: 'City details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'City not found' })
  async getCityById(@Param('id') id: string) {
    return await this.locationService.findCityById(id);
  }

  // ========== ADDRESSES (Protected endpoints) ==========

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new address',
    description: 'Creates a new address with full location details (country, state, city). Validates location hierarchy.'
  })
  @ApiResponse({
    status: 201,
    description: 'Address created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        streetAddress: 'Calle 100 #15-20',
        neighborhood: 'Chicó',
        apartment: 'Apt 301',
        postalCode: '110111',
        cityId: '550e8400-e29b-41d4-a716-446655440002',
        stateId: '550e8400-e29b-41d4-a716-446655440001',
        countryId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'primary',
        isDefault: false,
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid location hierarchy or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Valid JWT token required' })
  async createAddress(@Body() createAddressDto: CreateAddressDto) {
    return await this.locationService.createAddress(createAddressDto);
  }

  @Get('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get address by ID',
    description: 'Returns complete address information including related city, state, and country data'
  })
  @ApiParam({
    name: 'id',
    description: 'Address UUID',
    example: '550e8400-e29b-41d4-a716-446655440003'
  })
  @ApiResponse({
    status: 200,
    description: 'Address details with full location hierarchy',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        streetAddress: 'Calle 100 #15-20',
        city: { name: 'Bogotá' },
        state: { name: 'Cundinamarca' },
        country: { name: 'Colombia', code: 'COL' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAddressById(@Param('id') id: string) {
    return await this.locationService.findAddressById(id);
  }

  @Put('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update an address',
    description: 'Updates address information. If location IDs are changed, validates new location hierarchy.'
  })
  @ApiParam({
    name: 'id',
    description: 'Address UUID',
    example: '550e8400-e29b-41d4-a716-446655440003'
  })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid location hierarchy' })
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
  @ApiOperation({
    summary: 'Delete an address (soft delete)',
    description: 'Soft deletes an address by setting isActive to false. The address remains in the database but is no longer accessible.'
  })
  @ApiParam({
    name: 'id',
    description: 'Address UUID',
    example: '550e8400-e29b-41d4-a716-446655440003'
  })
  @ApiResponse({
    status: 200,
    description: 'Address deleted successfully',
    schema: {
      example: {
        message: 'Address deleted successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAddress(@Param('id') id: string) {
    await this.locationService.deleteAddress(id);
    return { message: 'Address deleted successfully' };
  }
}