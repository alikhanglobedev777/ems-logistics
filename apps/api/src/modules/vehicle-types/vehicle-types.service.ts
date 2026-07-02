import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateVehicleTypeRequest, UpdateVehicleTypeRequest } from '@ems/api-contract';
import { booleanOrDefault, optionalBoolean, optionalDecimal, optionalString, pagination, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import { toVehicleTypeResponse, toVehicleTypesListResponse } from './vehicle-types.mapper';
import { VehicleTypesRepository } from './vehicle-types.repository';

@Injectable()
export class VehicleTypesService {
  constructor(private readonly repo: VehicleTypesRepository) {}
  async list(query:{page?:unknown;limit?:unknown;search?:unknown;isActive?:unknown}) { const p=pagination(query.page,query.limit); const filters={search:optionalString(query.search)??undefined,isActive:optionalBoolean(query.isActive,'isActive')}; const [rows,total]=await Promise.all([this.repo.findAll(filters,p.offset,p.limit),this.repo.count(filters)]); return toVehicleTypesListResponse(rows,p.page,p.limit,total); }
  async get(idValue:unknown){ const row=await this.repo.findById(positiveInt(idValue,'vehicleTypeId')); if(!row) throw this.notFound(); return toVehicleTypeResponse(row); }
  async create(body:CreateVehicleTypeRequest){ const code=requiredString(body.code,'code').toUpperCase(); if(await this.repo.findByCode(code)) throw new ConflictException({error:{code:'VEHICLE_TYPE_CODE_EXISTS',message:'Vehicle type code already exists'}}); const row=await this.repo.create({name:requiredString(body.name,'name'),code,capacityTons:optionalDecimal(body.capacityTons,'capacityTons'),description:optionalString(body.description),isActive:booleanOrDefault(body.isActive)}); if(!row) throw new BadRequestException({error:{code:'CREATE_FAILED',message:'Vehicle type could not be created'}}); return toVehicleTypeResponse(row); }
  async update(idValue:unknown,body:UpdateVehicleTypeRequest){ const id=positiveInt(idValue,'vehicleTypeId'); const existing=await this.repo.findById(id); if(!existing) throw this.notFound(); let code: string|undefined; if(body.code!==undefined){code=requiredString(body.code,'code').toUpperCase(); const duplicate=await this.repo.findByCode(code); if(duplicate&&duplicate.id!==id) throw new ConflictException({error:{code:'VEHICLE_TYPE_CODE_EXISTS',message:'Vehicle type code already exists'}});} const row=await this.repo.update(id,{name:body.name===undefined?undefined:requiredString(body.name,'name'),code,capacityTons:body.capacityTons===undefined?undefined:optionalDecimal(body.capacityTons,'capacityTons'),description:body.description===undefined?undefined:optionalString(body.description),isActive:optionalBoolean(body.isActive,'isActive')}); return toVehicleTypeResponse(row!); }
  async remove(idValue:unknown){ const id=positiveInt(idValue,'vehicleTypeId'); if(!(await this.repo.findById(id))) throw this.notFound(); return toVehicleTypeResponse((await this.repo.update(id,{isActive:false}))!); }
  private notFound(){return new NotFoundException({error:{code:'VEHICLE_TYPE_NOT_FOUND',message:'Vehicle type not found'}});}
}
