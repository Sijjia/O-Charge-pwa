import { ErrorStatePage } from "./ErrorStatePage";

export function OfflinePage() {
  return (
    <ErrorStatePage
      icon="solar:wifi-router-linear"
      iconColor="gray"
      title="Нет подключения"
      message="Отсутствует интернет-соединение. Проверьте подключение к сети и попробуйте снова."
      primaryAction={{
        label: "Обновить",
        onClick: () => window.location.reload(),
      }}
      secondaryAction={{ label: "На главную", to: "/" }}
    />
  );
}

export default OfflinePage;
