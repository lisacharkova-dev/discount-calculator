import { useState } from "react";
import "./DiscountCalculator.css";

const CATEGORIES = [
  { id: "electronics", label: "Электроника", discount: 5 },
  { id: "clothing", label: "Одежда", discount: 15 },
  { id: "groceries", label: "Продукты", discount: 10 },
  { id: "books", label: "Книги", discount: 20 },
  { id: "other", label: "Другое", discount: 0 },
];

const VAT_RATE = 0.22;

// Вспомогательная функция для форматирования в рубли
const formatRub = (value) => {
  return Number(value).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function DiscountCalculator() {
  // --- СОСТОЯНИЯ ---
  // Задание 1: массив товаров (по умолчанию один пустой)
  const [items, setItems] = useState([
    { id: Date.now(), price: "", category: "electronics", customDiscount: 0 },
  ]);
  
  // Задание 2: промокод
  const [promoCode, setPromoCode] = useState("");
  
  // Задание 4: переключатель НДС
  const [withVat, setWithVat] = useState(true);
  
  // Задание 5: история расчетов
  const [history, setHistory] = useState([]);
  
  // Состояния для ошибки и флага расчета
  const [error, setError] = useState("");
  const [calculated, setCalculated] = useState(false);
  const [results, setResults] = useState(null);

  // --- ОБРАБОТЧИКИ ТОВАРОВ ---
  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setCalculated(false);
    setError("");
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), price: "", category: "electronics", customDiscount: 0 },
    ]);
    setCalculated(false);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setCalculated(false);
  };

  // --- РАСЧЕТ ---
  const handleCalculate = () => {
    // Валидация: все ли цены заполнены и корректны
    for (let item of items) {
      if (!item.price.trim()) {
        setError("Заполните цену для всех товаров");
        setCalculated(false);
        return;
      }
      const num = parseFloat(item.price);
      if (isNaN(num) || num <= 0) {
        setError("Цены должны быть положительными числами");
        setCalculated(false);
        return;
      }
    }

    setError("");
    let totalOriginal = 0;
    let totalDiscount = 0;
    let totalAfterDiscount = 0;
    let totalVat = 0;
    let totalToPay = 0;

    const isPromoValid = promoCode.trim().toUpperCase() === "WELCOME10";

    const calculatedItems = items.map((item) => {
      const price = parseFloat(item.price);
      const cat = CATEGORIES.find((c) => c.id === item.category);
      
      // Задание 3: если ползунок > 0, он заменяет скидку категории
      let baseDiscount = cat ? cat.discount : 0;
      const discountPercent = item.customDiscount > 0 ? item.customDiscount : baseDiscount;
      
      // Скидка по категории/ползунку
      let discountAmount = price * (discountPercent / 100);
      let priceAfter = price - discountAmount;

      // Задание 2: Промокод (доп. 10% от цены после первой скидки)
      if (isPromoValid) {
        const promoDiscount = priceAfter * 0.10;
        discountAmount += promoDiscount;
        priceAfter -= promoDiscount;
      }

      // Задание 4: НДС
      const vatAmount = withVat ? priceAfter * VAT_RATE : 0;
      const finalPrice = priceAfter + vatAmount;

      totalOriginal += price;
      totalDiscount += discountAmount;
      totalAfterDiscount += priceAfter;
      totalVat += vatAmount;
      totalToPay += finalPrice;

      return { ...item, price, discountPercent, discountAmount, priceAfter, vatAmount, finalPrice };
    });

    const resultData = { calculatedItems, totalOriginal, totalDiscount, totalAfterDiscount, totalVat, totalToPay };
    setResults(resultData);
    setCalculated(true);

    // Задание 5: Сохраняем в историю (максимум 5)
    setHistory((prev) => [
      { id: Date.now(), date: new Date().toLocaleTimeString("ru-RU"), total: totalToPay, itemsCount: items.length },
      ...prev.slice(0, 4), // оставляем только последние 5
    ]);
  };

  const handleReset = () => {
    setItems([{ id: Date.now(), price: "", category: "electronics", customDiscount: 0 }]);
    setPromoCode("");
    setWithVat(true);
    setCalculated(false);
    setError("");
    setResults(null);
  };

  return (
    <div className="calculator-wrapper">
      <h2 className="calculator-title">Калькулятор скидок</h2>

      {/* СПИСОК ТОВАРОВ */}
      {items.map((item, index) => {
        const cat = CATEGORIES.find((c) => c.id === item.category);
        return (
          <div key={item.id} className="item-card">
            <div className="item-header">
              <h3>Товар {index + 1}</h3>
              {items.length > 1 && (
                <button className="btn-remove" onClick={() => removeItem(item.id)}>✕</button>
              )}
            </div>

            <div className="field">
              <label className="field__label">Цена товара (P)</label>
              <input
                type="text"
                className="field__input"
                value={item.price}
                onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
                placeholder="Например: 1000"
                inputMode="decimal"
              />
            </div>

            <div className="field">
              <label className="field__label">Категория товара</label>
              <select
                className="field__input field__select"
                value={item.category}
                onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — скидка {c.discount}%
                  </option>
                ))}
              </select>
            </div>

            {/* ЗАДАНИЕ 3: Кастомная скидка */}
            <div className="field">
              <label className="field__label">
                Кастомная скидка: {item.customDiscount}% (0 = скидка категории)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={item.customDiscount}
                onChange={(e) => handleItemChange(item.id, "customDiscount", Number(e.target.value))}
                className="slider"
              />
            </div>
          </div>
        );
      })}

      <button className="btn btn--secondary" onClick={addItem} style={{ marginBottom: "20px" }}>
        + Добавить товар
      </button>

      {/* ЗАДАНИЕ 2: Промокод */}
      <div className="field">
        <label className="field__label">Промокод (WELCOME10)</label>
        <input
          type="text"
          className="field__input"
          value={promoCode}
          onChange={(e) => { setPromoCode(e.target.value); setCalculated(false); }}
          placeholder="Введите код"
        />
      </div>

      {/* ЗАДАНИЕ 4: Переключатель НДС */}
      <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
        <input
          type="checkbox"
          id="vatToggle"
          checked={withVat}
          onChange={(e) => { setWithVat(e.target.checked); setCalculated(false); }}
        />
        <label htmlFor="vatToggle" style={{ cursor: "pointer" }}>Учитывать НДС (22%)</label>
      </div>

      {error && <span className="field__error">{error}</span>}

      {/* КНОПКИ */}
      <div className="actions">
        <button className="btn btn--primary" onClick={handleCalculate}>Рассчитать</button>
        <button className="btn btn--secondary" onClick={handleReset}>Сбросить</button>
      </div>

      {/* РЕЗУЛЬТАТЫ */}
      {calculated && results && (
        <div className="results">
          <h3 className="results__title">Результат расчёта</h3>
          <table className="results__table">
            <tbody>
              {results.calculatedItems.map((item, i) => (
                <tr key={item.id}>
                  <td>Товар {i + 1} ({item.discountPercent}%)</td>
                  <td className="results__value">{formatRub(item.finalPrice)} ₽</td>
                </tr>
              ))}
              <tr>
                <td>Общая сумма скидок</td>
                <td className="results__value results__value--discount">
                  {formatRub(results.totalDiscount)} ₽
                </td>
              </tr>
              <tr>
                <td>Цена после скидки</td>
                <td className="results__value">{formatRub(results.totalAfterDiscount)} ₽</td>
              </tr>
              <tr>
                <td>НДС</td>
                <td className="results__value">+{formatRub(results.totalVat)} ₽</td>
              </tr>
              <tr className="results__row--total">
                <td>Итого к оплате</td>
                <td className="results__value">{formatRub(results.totalToPay)} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ЗАДАНИЕ 5: История */}
      {history.length > 0 && (
        <div className="history">
          <h3 className="results__title">Последние расчёты:</h3>
          <ul className="history__list">
            {history.map((h) => (
              <li key={h.id}>
                {h.date} — Товаров: {h.itemsCount} — Сумма: {formatRub(h.total)} ₽
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DiscountCalculator;