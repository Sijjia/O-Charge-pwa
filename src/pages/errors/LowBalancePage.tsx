import { useNavigate } from "react-router-dom";
import { ErrorStatePage } from "./ErrorStatePage";

export function LowBalancePage() {
  const navigate = useNavigate();

  return (
    <ErrorStatePage
      icon="solar:wallet-linear"
      iconColor="amber"
      title="Недостаточно средств"
      message="На вашем балансе недостаточно средств для начала зарядки. Пополните баланс и попробуйте снова."
      primaryAction={{
        label: "Пополнить баланс",
        onClick: () => navigate("/topup"),
      }}
      secondaryAction={{ label: "На главную", to: "/" }}
    />
  );
}

export default LowBalancePage;
