import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthedRequest } from '../auth/firebase-auth.guard';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const authedReq = req as AuthedRequest;
    if (authedReq.firebase?.uid) {
      return authedReq.firebase.uid;
    }
    return super.getTracker(req);
  }
}
