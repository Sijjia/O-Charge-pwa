import { ErrorStatePage } from "./ErrorStatePage";

export function PaymentErrorPage() {
  return (
    <ErrorStatePage
      icon="solar:card-broken-linear"
      iconColor="red"
      title="Ошибка оплаты"
      message="Не удалось обработать платёж. Проверьте данные карты или попробуйте другой способ оплаты."
      primaryAction={{ label: "Попробовать снова", to: "/topup" }}
      secondaryAction={{ label: "На главную", to: "/" }}
      showSupport
    />
  );
}

export default PaymentErrorPage;
