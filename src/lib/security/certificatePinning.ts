/**
 * Certificate Pinning - PWA version
 * В PWA certificate pinning управляется браузером автоматически
 * Этот файл служит заглушкой для совместимости с кодом
 */

import { logger } from "@/shared/utils/logger";

class CertificatePinningService {
  /**
   * Initialize certificate pinning
   * PWA: Заглушка - браузер управляет сертификатами
   */
  async initialize(): Promise<void> {
    logger.info(
      "Certificate pinning: Browser handles certificate validation automatically",
    );
    // В PWA certificate pinning не нужен
    // Браузеры управляют проверкой сертификатов самостоятельно
  }
}

// Export singleton instance
export const certificatePinning = new CertificatePinningService();
