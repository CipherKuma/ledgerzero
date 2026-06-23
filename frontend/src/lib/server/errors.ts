export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function isPaymentOrFundsError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("insufficient balance") ||
    message.includes("insufficient funds") ||
    message.includes("balance too low") ||
    message.includes("payment_error") ||
    message.includes("estimateGas".toLowerCase()) ||
    message.includes("missing revert data")
  );
}

export function publicIntegrationError(prefix: string, error: unknown) {
  const message = errorMessage(error);
  if (isPaymentOrFundsError(error)) {
    return {
      status: 402,
      body: {
        error: `${prefix}: funding or provider credits are insufficient for this live 0G operation`,
        detail: message.slice(0, 320),
      },
    };
  }
  return {
    status: 502,
    body: { error: `${prefix}: ${message}` },
  };
}
