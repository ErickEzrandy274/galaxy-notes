import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { requestContext } from '../context/request-context';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends ConsoleLogger {
  private prefixRequestId(message: string): string {
    const ctx = requestContext.getStore();
    const id = ctx?.requestId ?? '-';
    return `[${id}] ${message}`;
  }

  log(message: string, ...optionalParams: unknown[]) {
    super.log(this.prefixRequestId(message), ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]) {
    super.error(this.prefixRequestId(message), ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]) {
    super.warn(this.prefixRequestId(message), ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]) {
    super.debug(this.prefixRequestId(message), ...optionalParams);
  }

  verbose(message: string, ...optionalParams: unknown[]) {
    super.verbose(this.prefixRequestId(message), ...optionalParams);
  }
}
