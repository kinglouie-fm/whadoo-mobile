import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { AppUserGuard } from "../auth/app-user.guard";
import { AuthService } from "../auth/auth.service";
import { AuthedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { AssetsService } from "./assets.service";

/**
 * Endpoints for staged image upload and finalization.
 */
@Controller("assets")
@UseGuards(FirebaseAuthGuard, AppUserGuard, RolesGuard)
export class AssetsController {
  constructor(
    private assetsService: AssetsService,
    private authService: AuthService,
  ) {}

  /**
   * Resolves or creates the backing app user for an authenticated Firebase identity.
   */
  private async currentDbUser(req: AuthedRequest) {
    const fb = req.firebase!;
    return this.authService.getOrCreateUser(
      fb.uid,
      fb.email ?? undefined,
      fb.picture ?? undefined,
    );
  }

  /**
   * Uploads an image file into user-scoped staging storage.
   */
  @Post("upload")
  @Throttle({ default: { limit: 50, ttl: 3600000 } })
  @UseInterceptors(
    FileInterceptor("image", {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          return cb(
            new BadRequestException({
              statusCode: 400,
              error: "INVALID_FILE_TYPE",
              message:
                "Only image files are allowed (JPEG, PNG, GIF, WebP)",
            }),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @Req() req: AuthedRequest,
    @UploadedFile() file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException({
        statusCode: 400,
        error: "NO_FILE",
        message: "No file uploaded",
      });
    }

    // Persisting under staging requires an internal user id and firebase uid mapping.
    const user = await this.currentDbUser(req);
    return this.assetsService.uploadToStaging(user, file);
  }

  /**
   * Finalizes a staged upload and links the resulting asset to its target entity.
   */
  @Post("finalize")
  async finalize(@Req() req: AuthedRequest, @Body() body: any) {
    const user = await this.currentDbUser(req);
    return this.assetsService.finalizeUpload(user.id, body);
  }
}
