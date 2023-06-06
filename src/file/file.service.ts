import { Injectable } from '@nestjs/common'
import { writeFile } from 'node:fs/promises'

@Injectable()
export class FileService {
  async upload(file: Express.Multer.File, path: string) {
    return writeFile(path, file.buffer)
  }
}
