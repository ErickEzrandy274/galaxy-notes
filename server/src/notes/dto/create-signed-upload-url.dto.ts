import { IsString, IsNumber, IsIn } from 'class-validator';

export class CreateSignedUploadUrlDto {
  @IsString()
  noteId: string;

  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  @IsIn(['rich-text-editor', 'attachment'])
  source: 'rich-text-editor' | 'attachment';
}
