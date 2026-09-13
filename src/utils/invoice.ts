/**
 * Calcula o mês de referência da fatura (formato "YYYY-MM") em que uma
 * parcela cai, dado o dia de fechamento do cartão.
 *
 * Regra: se a compra foi feita ANTES do fechamento, cai na fatura do mês
 * atual. Se foi feita NO DIA do fechamento ou depois, cai na fatura do
 * mês seguinte. Cada parcela subsequente empurra um mês a mais.
 */
export function calcularInvoiceMonth(dataCompra: Date, closingDay: number, offsetParcelas = 0): string {
  const dia = dataCompra.getDate();
  let mes = dataCompra.getMonth();
  let ano = dataCompra.getFullYear();

  if (dia >= closingDay) {
    mes += 1;
  }

  mes += offsetParcelas;

  ano += Math.floor(mes / 12);
  mes = ((mes % 12) + 12) % 12;

  return `${ano}-${String(mes + 1).padStart(2, '0')}`;
}

/**
 * Calcula a data de vencimento de uma fatura. Se o dia de vencimento é
 * MENOR que o dia de fechamento, o vencimento cai no mês seguinte ao mês
 * de referência da fatura (caso mais comum: fecha dia 25, vence dia 5).
 */
export function calcularDueDate(invoiceMonth: string, closingDay: number, dueDay: number): Date {
  const [anoRef, mesRef] = invoiceMonth.split('-').map(Number);
  let mes = mesRef - 1; // zero-indexed
  let ano = anoRef;

  if (dueDay < closingDay) {
    mes += 1;
  }

  ano += Math.floor(mes / 12);
  mes = ((mes % 12) + 12) % 12;

  return new Date(ano, mes, dueDay);
}

/** Retorna 'open' se a fatura ainda não fechou, 'closed' caso contrário. */
export function calcularStatusFatura(invoiceMonth: string, closingDay: number): 'open' | 'closed' {
  const hoje = new Date();
  const [ano, mes] = invoiceMonth.split('-').map(Number);
  const dataFechamento = new Date(ano, mes - 1, closingDay);
  return hoje < dataFechamento ? 'open' : 'closed';
}

/**
 * Faz o parse de uma data no formato "YYYY-MM-DD" como horário LOCAL,
 * evitando o bug clássico de `new Date(string)` interpretar como UTC
 * e "voltar um dia" em fusos horários negativos (como o Brasil).
 */
export function parseDataLocal(dateStr: string): Date {
  const [ano, mes, dia] = dateStr.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}
