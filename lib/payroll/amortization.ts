export interface AmortizationRow {
  month: number;
  emi: number;
  interest: number;
  principal: number;
  balance: number;
}

export function buildAmortizationSchedule(
  principal: number,
  annualInterestRate: number,
  emi: number
): AmortizationRow[] {
  const monthlyRate = annualInterestRate / 12 / 100;
  const rows: AmortizationRow[] = [];
  let balance = principal;
  let month = 1;

  while (balance > 0 && month <= 600) {
    const interest = Math.round(balance * monthlyRate);
    const principalPaid = Math.min(balance, emi - interest);
    if (principalPaid <= 0) break;
    balance = Math.round((balance - principalPaid) * 100) / 100;
    rows.push({ month, emi: Math.round(interest + principalPaid), interest, principal: Math.round(principalPaid), balance });
    month++;
  }
  return rows;
}
