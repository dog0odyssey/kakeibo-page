"use strict";

const STORAGE_KEY = "kakeibo-page.entries.v1";
const form = document.querySelector("form");
const tableBody = document.querySelector("table tbody");
const totalOutput = document.querySelector('output[name="total"]');
const amountFormatter = new Intl.NumberFormat("ja-JP");

// 保存データに不正な値が含まれていても、表示や計算を続けられるようにする。
function isValidEntry(entry) {
  return entry !== null &&
    typeof entry === "object" &&
    typeof entry.date === "string" && entry.date.length > 0 &&
    typeof entry.item === "string" && entry.item.length > 0 &&
    (entry.type === "income" || entry.type === "expense") &&
    Number.isSafeInteger(entry.amount) && entry.amount >= 0;
}

function loadEntries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
  } catch {
    return [];
  }
}

function saveEntries(nextEntries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
    return true;
  } catch {
    window.alert("データを保存できませんでした。ブラウザーの保存設定や空き容量を確認してください。入力内容はそのまま残しています。");
    return false;
  }
}

function renderEntries() {
  tableBody.replaceChildren();

  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "登録されたデータはありません。";
    row.append(cell);
    tableBody.append(row);
    return;
  }

  const rows = document.createDocumentFragment();
  for (const entry of entries) {
    const row = document.createElement("tr");
    const values = [
      entry.date,
      entry.item,
      entry.type === "income" ? "収入" : "支出",
      amountFormatter.format(entry.amount),
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    rows.append(row);
  }
  tableBody.append(rows);
}

function renderTotal() {
  // 合計が大きくなっても整数の円単位で正確に計算する。
  const total = entries.reduce((sum, entry) => {
    const amount = BigInt(entry.amount);
    return entry.type === "income" ? sum + amount : sum - amount;
  }, 0n);
  totalOutput.value = amountFormatter.format(total);
}

function handleSubmit(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const entry = {
    date: data.get("date"),
    item: data.get("item"),
    type: data.get("type"),
    amount: Number(data.get("amount")),
  };

  if (!isValidEntry(entry)) {
    window.alert("入力内容を確認してください。金額は0〜9,007,199,254,740,991円の整数で入力してください。");
    return;
  }

  const nextEntries = [...entries, entry];
  if (!saveEntries(nextEntries)) return;

  entries = nextEntries;
  renderEntries();
  renderTotal();
  form.reset();
}

let entries = loadEntries();
renderEntries();
renderTotal();
form.addEventListener("submit", handleSubmit);
