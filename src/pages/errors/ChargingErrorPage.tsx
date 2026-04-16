import { ErrorStatePage } from "./ErrorStatePage";

export function ChargingErrorPage() {
  return (
    <ErrorStatePage
      icon="solar:close-circle-linear"
      iconColor="red"
      title="Ошибка зарядки"
      message="Не удалось начать или завершить зарядку. Проверьте подключение коннектора и попробуйте снова."
      primaryAction={{ label: "Попробовать снова", to: "/" }}
      secondaryAction={{ label: "Выбрать другую станцию", to: "/stations" }}
      showSupport
    />
  );
}

export default ChargingErrorPage;
