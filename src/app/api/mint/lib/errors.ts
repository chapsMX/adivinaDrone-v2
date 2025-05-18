/**
 * Simple utility to check if an error is a user rejection error
 */
export function isUserRejectionError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes("user rejected") ||
        message.includes("user denied") ||
        message.includes("rejected by user") ||
        message.includes("transaction was rejected")
      );
    }
    return false;
  }