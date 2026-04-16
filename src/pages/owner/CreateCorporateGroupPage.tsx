import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { Icon } from "@iconify/react";
import { useCreateCorporateGroup } from "@/features/owner/hooks/useAdminCorporate";

export function CreateCorporateGroupPage() {
  const navigate = useNavigate();
  const base = usePanelBase();
  const createMutation = useCreateCorporateGroup();

  const [companyName, setCompanyName] = useState("");
  const [billingType, setBillingType] = useState("prepaid");
  const [inn, setInn] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [contractExpires, setContractExpires] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!companyName.trim()) {
      setError("Укажите название компании");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        company_name: companyName.trim(),
        billing_type: billingType,
        inn: inn.trim() || undefined,
        legal_address: legalAddress.trim() || undefined,
        contact_person: contactPerson.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        monthly_limit: monthlyLimit ? parseFloat(monthlyLimit) : undefined,
        credit_limit: creditLimit ? parseFloat(creditLimit) : undefined,
        contract_number: contractNumber.trim() || undefined,
        contract_date: contractDate || undefined,
        contract_expires: contractExpires || undefined,
      });
      navigate(`${base}/corporate/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать группу");
    }
  };

  const inputCls = "w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors";
  const selectCls = `${inputCls} appearance-none`;

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`${base}/corporate`)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Icon icon="solar:alt-arrow-left-linear" width={20} className="text-zinc-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">Новая корпоративная группа</h1>
          <p className="text-sm text-zinc-500 mt-1">Заполните данные корпоративного клиента</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Company Info */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Информация о компании</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Название компании *</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} placeholder="ООО Рога и Копыта" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Тип биллинга</label>
              <select value={billingType} onChange={(e) => setBillingType(e.target.value)} className={selectCls}>
                <option value="prepaid">Prepaid (предоплата)</option>
                <option value="postpaid">Postpaid (постоплата)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">ИНН</label>
              <input value={inn} onChange={(e) => setInn(e.target.value)} className={inputCls} placeholder="1234567890" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Юридический адрес</label>
            <input value={legalAddress} onChange={(e) => setLegalAddress(e.target.value)} className={inputCls} placeholder="г. Бишкек, ул. Примерная, 1" />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Контактные данные</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Контактное лицо</label>
            <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputCls} placeholder="Иванов Иван Иванович" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Телефон</label>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputCls} placeholder="+996 555 123 456" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputCls} placeholder="company@example.com" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Info */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Финансы и договор</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Месячный лимит (KGS)</label>
              <input type="number" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} className={inputCls} placeholder="100000" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Кредитный лимит (KGS)</label>
              <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className={inputCls} placeholder="50000" min={0} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Номер договора</label>
            <input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} className={inputCls} placeholder="ДГ-2026/001" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Дата договора</label>
              <input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Договор действует до</label>
              <input type="date" value={contractExpires} onChange={(e) => setContractExpires(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate(`${base}/corporate`)}
          className="px-6 py-3 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {createMutation.isPending && <Icon icon="solar:refresh-linear" width={16} className="animate-spin" />}
          Создать группу
        </button>
      </div>
    </div>
  );
}

export default CreateCorporateGroupPage;
