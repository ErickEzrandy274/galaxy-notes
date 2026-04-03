import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const ALLOWED_MIME_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async searchByEmail(query: string, excludeUserId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        photo: true,
      },
      take: 10,
    });

    return Promise.all(
      users.map(async (u) => ({
        ...u,
        photo: await this.resolvePhotoUrl(u.photo),
      })),
    );
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        bio: true,
        photo: true,
        userType: true,
        createdAt: true,
        accounts: {
          select: { provider: true },
          take: 1,
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const { accounts, ...profile } = user;
    const connectedAccount =
      accounts.length > 0
        ? { provider: accounts[0].provider, providerEmail: user.email }
        : null;

    const photo = await this.resolvePhotoUrl(profile.photo);

    return { ...profile, photo, connectedAccount };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userType: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const data: Record<string, string | null> = {};

    if (user.userType === 'general_user') {
      if (dto.firstName !== undefined) data.firstName = dto.firstName;
      if (dto.lastName !== undefined) data.lastName = dto.lastName;
    } else {
      if (dto.name !== undefined) data.name = dto.name;
    }

    if (dto.bio !== undefined) data.bio = dto.bio;

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        bio: true,
        photo: true,
        userType: true,
        createdAt: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userType: true, password: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.userType !== 'general_user') {
      throw new BadRequestException('OAuth users cannot change password');
    }

    if (!user.password) {
      throw new BadRequestException('No password set for this account');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async createPhotoUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
  ) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        'Invalid file type. Only .webp, .jpg, and .png are allowed.',
      );
    }
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 1MB limit.');
    }

    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/avatar/${Date.now()}_${sanitized}`;

    const { data, error } = await this.supabase.storage
      .from('galaxy-notes-staging')
      .createSignedUploadUrl(path);

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    return { signedUrl: data.signedUrl, token: data.token, path };
  }

  async updatePhoto(userId: string, photoPath: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { photo: true },
    });

    if (user?.photo) {
      await this.deleteStorageFile(user.photo);
    }

    // Store the path, not the full URL
    const storagePath = this.toStoragePath(photoPath);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { photo: storagePath },
      select: { photo: true },
    });

    return { photo: await this.resolvePhotoUrl(updated.photo) };
  }

  async removePhoto(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { photo: true },
    });

    if (user?.photo) {
      await this.deleteStorageFile(user.photo);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { photo: null },
      select: { photo: true },
    });
  }

  /** Convert a public URL or path to a plain storage path. */
  private toStoragePath(input: string): string {
    if (input.startsWith('http')) {
      const match = input.match(/\/galaxy-notes-staging\/([^?]+)/);
      return match ? decodeURIComponent(match[1]) : input;
    }
    return input;
  }

  /** Resolve a stored photo value (path or legacy URL) to a signed URL. */
  private async resolvePhotoUrl(photo: string | null): Promise<string | null> {
    if (!photo) return null;

    const storagePath = this.toStoragePath(photo);

    const { data } = await this.supabase.storage
      .from('galaxy-notes-staging')
      .createSignedUrl(storagePath, 3600);

    return data?.signedUrl ?? null;
  }

  private async deleteStorageFile(stored: string) {
    const path = this.toStoragePath(stored);
    if (!path) return;

    await this.supabase.storage.from('galaxy-notes-staging').remove([path]);
  }
}
