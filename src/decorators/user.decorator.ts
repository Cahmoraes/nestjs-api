import {
  createParamDecorator,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common'
import { Request } from 'express'
import { User as UserDTO } from '@prisma/client'

export const User = createParamDecorator(userDecoratorFactory)

function userDecoratorFactory(
  filters: (keyof UserDTO)[],
  ctx: ExecutionContext,
) {
  const request = ctx.switchToHttp().getRequest<Request>()
  if (!hasUserRequest())
    throw new NotFoundException(
      'Usuário não encontrado no Request. Use o AuthGuard para obter o usuário',
    )
  if (!hasFilter()) return request.user
  return filterUserRequest()

  function hasUserRequest(): boolean {
    return Reflect.has(request, 'user')
  }

  function hasFilter(): boolean {
    return filters !== undefined && filters !== null && filters.length > 0
  }

  function filterUserRequest() {
    return filters.reduce((result, item) => {
      return {
        ...result,
        [item]: request.user[item],
      }
    }, {})
  }
}
