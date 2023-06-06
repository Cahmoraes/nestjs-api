import { NestMiddleware, BadRequestException } from '@nestjs/common'
import { NextFunction, Request } from 'express'

export class UseIdCheckMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params
    console.log(`Middleware: ${id}`)
    if (isNaN(Number(id)) || Number(id) <= 0) {
      throw new BadRequestException('ID inválido.')
    }
    next()
  }
}
