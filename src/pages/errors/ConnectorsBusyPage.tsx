import { ErrorStatePage } from "./ErrorStatePage";

export function ConnectorsBusyPage() {
  return (
    <ErrorStatePage
      icon="solar:clock-circle-linear"
      iconColor="amber"
      title="Все коннекторы заняты"
      message="В данный момент все коннекторы на этой станции заняты. Попробуйте позже или выберите другую станцию."
      primaryAction={{ label: "Найти другую станцию", to: "/" }}
      secondaryAction={{ label: "Назад", to: "/" }}
    />
  );
}

export default ConnectorsBusyPage;
