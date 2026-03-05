import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthedRequest } from '../auth/firebase-auth.guard';

/**
 * Throttler tracker keyed by authenticated Firebase uid when available.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  /**
   * Uses user identity for rate limiting; falls back to default tracker for anonymous traffic.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const authedReq = req as AuthedRequest;
    if (authedReq.firebase?.uid) {
      return authedReq.firebase.uid;
    }
    return super.getTracker(req);
  }
}
