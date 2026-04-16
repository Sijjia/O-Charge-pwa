import { ErrorStatePage } from "./ErrorStatePage";

export function LimitReachedPage() {
  return (
    <ErrorStatePage
      icon="solar:shield-check-linear"
      iconColor="blue"
      title="Лимит достигнут"
      message="Вы достигли лимита зарядки. Зарядка автоматически остановлена в соответствии с установленными ограничениями."
      primaryAction={{ label: "На главную", to: "/" }}
      secondaryAction={{ label: "Подробнее", to: "/support" }}
    />
  );
}

export default LimitReachedPage;
