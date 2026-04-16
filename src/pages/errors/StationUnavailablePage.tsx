import { ErrorStatePage } from "./ErrorStatePage";

export function StationUnavailablePage() {
  return (
    <ErrorStatePage
      icon="solar:ev-station-linear"
      iconColor="gray"
      title="Станция недоступна"
      message="Данная зарядная станция временно недоступна. Попробуйте выбрать другую станцию на карте."
      primaryAction={{ label: "Выбрать другую станцию", to: "/" }}
      secondaryAction={{ label: "Назад", to: "/" }}
      showSupport
    />
  );
}

export default StationUnavailablePage;
