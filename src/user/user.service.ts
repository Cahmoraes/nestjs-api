import { Injectable, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { CreateUserDTO } from './dto/create-user.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import { User } from '@prisma/client'
import { UpdateUserDTO } from './dto/update-user.dto'
import { UpdatePatchUserDTO } from './dto/update-patch-user.dto'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDTO): Promise<User> {
    data.password = await bcrypt.hash(data.password, await bcrypt.genSalt())
    return this.prisma.user.create({
      data: {
        ...data,
        birthAt: new Date(data.birthAt),
      },
    })
  }

  async list(): Promise<User[]> {
    return this.prisma.user.findMany()
  }

  async show(id: number): Promise<User> {
    await this.throwIfNotExists(id)
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    })
  }

  async update(id: number, updateUserDTO: UpdateUserDTO) {
    this.throwIfNotExists(id)
    updateUserDTO.password = await bcrypt.hash(
      updateUserDTO.password,
      await bcrypt.genSalt(),
    )

    if (!updateUserDTO.birthAt) {
      updateUserDTO.birthAt = ''
    }

    return this.prisma.user.update({
      data: updateUserDTO,
      where: {
        id,
      },
    })
  }

  private async throwIfNotExists(id: number): Promise<void> {
    const userExists = await this.prisma.user.count({
      where: { id },
    })
    if (!userExists) {
      throw new NotFoundException(`O usuário ${id} não existe.`)
    }
  }

  async updatePartial(id: number, updateUserDTO: UpdatePatchUserDTO) {
    this.throwIfNotExists(id)

    if (updateUserDTO.password) {
      updateUserDTO.password = await bcrypt.hash(
        updateUserDTO.password,
        await bcrypt.genSalt(),
      )
    }

    return this.prisma.user.update({
      data: updateUserDTO,
      where: {
        id,
      },
    })
  }

  async delete(id: number) {
    this.throwIfNotExists(id)
    return this.prisma.user.delete({
      where: {
        id,
      },
    })
  }
}
