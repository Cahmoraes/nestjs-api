import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Request,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'

export class LogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now()
    const request = context.switchToHttp().getRequest<Request>()
    console.log(`URL: ${request.url} | method: ${request.method}`)
    return next.handle().pipe(
      tap(() => {
        console.log(`A execução levou: ${Date.now() - now}ms`)
      }),
    )
  }
}
