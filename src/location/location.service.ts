import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country, State, City, Address } from './entities';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  // Country methods
  async findAllCountries() {
    return this.countryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      select: ['id', 'name', 'code', 'iso2', 'phoneCode', 'currency', 'region']
    });
  }

  async findCountryById(id: string, includeRelations = false) {
    const options: any = {
      where: { id, isActive: true }
    };

    if (includeRelations) {
      options.relations = ['states'];
    }

    const country = await this.countryRepository.findOne(options);
    if (!country) {
      throw new NotFoundException(`Country with id ${id} not found`);
    }
    return country;
  }

  async findCountryByCode(code: string, includeRelations = false) {
    const options: any = {
      where: { code, isActive: true }
    };

    if (includeRelations) {
      options.relations = ['states'];
    }

    const country = await this.countryRepository.findOne(options);
    if (!country) {
      throw new NotFoundException(`Country with code ${code} not found`);
    }
    return country;
  }

  // State methods
  async findStatesByCountry(countryId: string) {
    return this.stateRepository.find({
      where: { countryId, isActive: true },
      order: { name: 'ASC' },
      select: ['id', 'name', 'code', 'type', 'countryId']
    });
  }

  async findStateById(id: string, includeRelations = false) {
    const options: any = {
      where: { id, isActive: true }
    };

    if (includeRelations) {
      options.relations = ['country'];
    }

    const state = await this.stateRepository.findOne(options);
    if (!state) {
      throw new NotFoundException(`State with id ${id} not found`);
    }
    return state;
  }

  // City methods
  async findCitiesByState(stateId: string, limit?: number) {
    const query: any = {
      where: { stateId, isActive: true },
      order: { name: 'ASC' },
      select: ['id', 'name', 'postalCode', 'stateId']
    };

    if (limit) {
      query.take = limit;
    }

    return this.cityRepository.find(query);
  }

  async findCityById(id: string, includeRelations = false) {
    const options: any = {
      where: { id, isActive: true }
    };

    if (includeRelations) {
      options.relations = ['state', 'state.country'];
    }

    const city = await this.cityRepository.findOne(options);
    if (!city) {
      throw new NotFoundException(`City with id ${id} not found`);
    }
    return city;
  }

  // Address methods
  async createAddress(createAddressDto: CreateAddressDto): Promise<Address> {
    // Validate location hierarchy in a single query
    await this.validateLocationHierarchy(
      createAddressDto.cityId,
      createAddressDto.stateId,
      createAddressDto.countryId
    );

    const address = this.addressRepository.create(createAddressDto);
    return this.addressRepository.save(address);
  }

  async findAddressById(id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, isActive: true },
      relations: ['city', 'state', 'country']
    });
    if (!address) {
      throw new NotFoundException(`Address with id ${id} not found`);
    }
    return address;
  }

  async updateAddress(id: string, updateAddressDto: Partial<CreateAddressDto>): Promise<Address> {
    const address = await this.findAddressById(id);

    // If location IDs are being updated, validate them
    const cityId = updateAddressDto.cityId || address.cityId;
    const stateId = updateAddressDto.stateId || address.stateId;
    const countryId = updateAddressDto.countryId || address.countryId;

    if (
      updateAddressDto.cityId ||
      updateAddressDto.stateId ||
      updateAddressDto.countryId
    ) {
      await this.validateLocationHierarchy(cityId, stateId, countryId);
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async deleteAddress(id: string): Promise<void> {
    const address = await this.findAddressById(id);
    address.isActive = false;
    await this.addressRepository.save(address);
  }

  // Helper method to validate location hierarchy
  private async validateLocationHierarchy(
    cityId: string,
    stateId: string,
    countryId: string
  ): Promise<void> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId, isActive: true },
      relations: ['state', 'state.country']
    });

    if (!city) {
      throw new BadRequestException(`City with id ${cityId} not found`);
    }

    if (city.stateId !== stateId) {
      throw new BadRequestException(
        `City ${cityId} does not belong to state ${stateId}`
      );
    }

    if (city.state.countryId !== countryId) {
      throw new BadRequestException(
        `State ${stateId} does not belong to country ${countryId}`
      );
    }
  }
}
