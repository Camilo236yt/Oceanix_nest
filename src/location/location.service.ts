import { Injectable, NotFoundException } from '@nestjs/common';
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
    return await this.countryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findCountryById(id: string) {
    const country = await this.countryRepository.findOne({
      where: { id, isActive: true },
      relations: ['states', 'states.cities']
    });
    if (!country) {
      throw new NotFoundException(`Country with id ${id} not found`);
    }
    return country;
  }

  async findCountryByCode(code: string) {
    const country = await this.countryRepository.findOne({
      where: { code, isActive: true },
      relations: ['states', 'states.cities']
    });
    if (!country) {
      throw new NotFoundException(`Country with code ${code} not found`);
    }
    return country;
  }

  // State methods
  async findStatesByCountry(countryId: string) {
    return await this.stateRepository.find({
      where: { countryId, isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findStateById(id: string) {
    const state = await this.stateRepository.findOne({
      where: { id, isActive: true },
      relations: ['country']
    });
    if (!state) {
      throw new NotFoundException(`State with id ${id} not found`);
    }
    return state;
  }

  // City methods
  async findCitiesByState(stateId: string) {
    return await this.cityRepository.find({
      where: { stateId, isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findCityById(id: string) {
    const city = await this.cityRepository.findOne({
      where: { id, isActive: true },
      relations: ['state', 'state.country']
    });
    if (!city) {
      throw new NotFoundException(`City with id ${id} not found`);
    }
    return city;
  }

  // Address methods
  async createAddress(createAddressDto: CreateAddressDto): Promise<Address> {
    // Validate that city, state and country exist
    await this.findCityById(createAddressDto.cityId);
    await this.findStateById(createAddressDto.stateId);
    await this.findCountryById(createAddressDto.countryId);

    const address = this.addressRepository.create(createAddressDto);
    return await this.addressRepository.save(address);
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
    if (updateAddressDto.cityId && updateAddressDto.cityId !== address.cityId) {
      await this.findCityById(updateAddressDto.cityId);
    }
    if (updateAddressDto.stateId && updateAddressDto.stateId !== address.stateId) {
      await this.findStateById(updateAddressDto.stateId);
    }
    if (updateAddressDto.countryId && updateAddressDto.countryId !== address.countryId) {
      await this.findCountryById(updateAddressDto.countryId);
    }

    Object.assign(address, updateAddressDto);
    return await this.addressRepository.save(address);
  }

  async deleteAddress(id: string): Promise<void> {
    const address = await this.findAddressById(id);
    address.isActive = false;
    await this.addressRepository.save(address);
  }
}
