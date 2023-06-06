import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { LogInterceptor } from './interceptors/log.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()

  await app
    .useGlobalPipes(new ValidationPipe())
    .useGlobalInterceptors(new LogInterceptor())
    .listen(3000)
}

bootstrap()
