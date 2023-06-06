import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from 'src/auth/auth.service'
import { UserService } from 'src/user/user.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const { authorization } = request.headers

    try {
      const data = await this.authService.checkToken(
        this.getTokenFromAuthorizationHeader(authorization),
      )
      const user = await this.userService.show(data.id)
      request.user = user
      request.tokenPayload = data

      return true
    } catch (error) {
      return false
    }
  }

  private getTokenFromAuthorizationHeader(header: string) {
    return header.split(' ')[1] ?? ''
  }
}
