import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express'
import { User as UserDTO } from '@prisma/client'
import { AuthLoginDTO } from './dto/auth-login.dto'
import { AuthRegisterDTO } from './dto/auth-register.dto'
import { AuthForgetDTO } from './dto/auth-forget.dto'
import { AuthResetDTO } from './dto/auth-reset.dto'
import { UserService } from 'src/user/user.service'
import { AuthService } from './auth.service'
import { AuthGuard } from 'src/guards/auth.guard'
import { User } from 'src/decorators/user.decorator'
import { join } from 'node:path'
import { FileService } from 'src/file/file.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly fileService: FileService,
  ) {}

  @Post('login')
  async login(@Body() { email, password }: AuthLoginDTO) {
    return this.authService.login(email, password)
  }

  @Post('register')
  async register(@Body() body: AuthRegisterDTO) {
    return this.userService.create(body)
  }

  @Post('forget')
  async forget(@Body() { email }: AuthForgetDTO) {
    return this.authService.forget(email)
  }

  @Post('reset')
  async reset(@Body() { password, token }: AuthResetDTO) {
    return this.authService.reset(password, token)
  }

  @UseGuards(AuthGuard)
  @Post('me')
  async me(@User(['id', 'email', 'name']) user: UserDTO) {
    return { user }
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('photo')
  async uploadPhoto(
    @User() user: UserDTO,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'image/*' }),
          new MaxFileSizeValidator({
            maxSize: 1024 * 30,
          }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ) {
    try {
      const result = await this.performUploadFile(photo, user.id)
      return { result }
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  private async performUploadFile(photo: Express.Multer.File, id: number) {
    return this.fileService.upload(photo, this.generateUploadPath(id))
  }

  private generateUploadPath(id: number) {
    return join(__dirname, '..', '..', 'storage', 'photos', `photo-${id}.png`)
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @Post('files')
  async uploadFiles(
    @User() user: UserDTO,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return { files }
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      {
        name: 'photo',
        maxCount: 1,
      },
      {
        name: 'documents',
        maxCount: 10,
      },
    ]),
  )
  @Post('files-fields')
  async uploadFilesFields(
    @User() user: UserDTO,
    @UploadedFiles()
    files: {
      photo: Express.Multer.File
      documents: Express.Multer.File
    },
  ) {
    return { files }
  }
}
