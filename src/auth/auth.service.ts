import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { User } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { AuthRegisterDTO } from './dto/auth-register.dto'
import { UserService } from 'src/user/user.service'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class AuthService {
  private issuer = 'login'
  private audience = 'users'

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly mailer: MailerService,
  ) {}

  async createToken(user: User) {
    const accessToken = this.jwtService.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      {
        expiresIn: '7 days',
        subject: String(user.id),
        issuer: this.issuer,
        audience: this.audience,
      },
    )
    return { accessToken }
  }

  async checkToken(token: string) {
    try {
      const data = this.jwtService.verify(token, {
        audience: this.audience,
        issuer: this.issuer,
      })
      return data
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async isValidToken(token: string) {
    try {
      this.checkToken(token)
      return true
    } catch (error) {
      return false
    }
  }

  async login(email: string, password: string) {
    const userExists = await this.prisma.user.findFirst({
      where: {
        email,
      },
    })

    if (!userExists) {
      throw new UnauthorizedException('Email e/ou senha incorretos.')
    }

    const isValidPassword = await bcrypt.compare(password, userExists.password)
    if (!isValidPassword) {
      throw new UnauthorizedException('Email e/ou senha incorretos.')
    }

    return this.createToken(userExists)
  }

  async forget(email: string) {
    const userExists = await this.prisma.user.findFirst({
      where: {
        email,
      },
    })

    if (!userExists) {
      throw new UnauthorizedException('Email está incorreto')
    }

    const token = this.jwtService.sign(
      {
        id: userExists.id,
      },
      {
        expiresIn: '30 minutes',
        subject: String(userExists.id),
        issuer: 'forget',
        audience: this.audience,
      },
    )

    await this.mailer.sendMail({
      subject: 'Recuperação de senha',
      to: 'joao@hcode.com.br',
      template: 'forget',
      context: {
        name: userExists.name,
        token,
      },
    })
    return true
  }

  async reset(password: string, token: string) {
    try {
      const data = this.jwtService.verify(token, {
        issuer: 'forget',
        audience: this.audience,
      })

      const id = data.id

      if (isNaN(Number(data.id))) {
        throw new BadRequestException('Token é inválido')
      }

      const passwordHashed = await bcrypt.hash(password, await bcrypt.genSalt())

      const user = await this.prisma.user.update({
        where: {
          id,
        },
        data: { password: passwordHashed },
      })
      return this.createToken(user)
    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async register(data: AuthRegisterDTO) {
    const user = await this.userService.create(data)
    return this.createToken(user)
  }
}
