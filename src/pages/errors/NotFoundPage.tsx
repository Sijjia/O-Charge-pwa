import { ErrorStatePage } from "./ErrorStatePage";

export function NotFoundPage() {
  return (
    <ErrorStatePage
      icon="solar:map-point-search-linear"
      iconColor="gray"
      title="Страница не найдена"
      message="Запрашиваемая страница не существует или была перемещена. Вернитесь на главную страницу."
      primaryAction={{ label: "На главную", to: "/" }}
    />
  );
}

export default NotFoundPage;
