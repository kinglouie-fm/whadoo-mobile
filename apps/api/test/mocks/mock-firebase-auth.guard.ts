import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthedRequest } from '../../src/auth/firebase-auth.guard';

@Injectable()
export class MockFirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    // Extract UID from token (in tests, we use "test-uid-xxx" as tokens)
    const token = authHeader.substring(7);

    // Mock Firebase user object
    request.firebase = {
      uid: token,
      email: `${token}@test.com`,
      picture: null,
    };

    return true;
  }
}
