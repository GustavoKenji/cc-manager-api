/**
 * Calcula o mês de referência da fatura (formato "YYYY-MM") em que uma
 * parcela cai, dado o dia de fechamento do cartão.
 *
 * Regra: se a compra foi feita ANTES do fechamento, cai na fatura do mês
 * atual. Se foi feita NO DIA do fechamento ou depois, cai na fatura do
 * mês seguinte. Cada parcela subsequente empurra um mês a mais.
 */
export function calcularInvoiceMonth(
  dataCompra: Date,
  closingDay: number,
  dueDay: number,
  offsetParcelas = 0,
): string {
  const dia = dataCompra.getDate();
  let mes = dataCompra.getMonth();
  let ano = dataCompra.getFullYear();

  if (dia >= closingDay) {
    mes += 1;
  }

  // O nome da fatura segue o mês de VENCIMENTO, não o de fechamento — é
  // assim que os bancos rotulam (ex: fecha 27/09, vence 03/10 → "fatura
  // de outubro"), mesmo reunindo compras feitas em setembro.
  if (dueDay < closingDay) {
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
/**
 * Como o invoiceMonth já representa o mês de vencimento, calcular a data
 * de vencimento fica direto: mesmo ano/mês do invoiceMonth, dia = dueDay.
 */
export function calcularDueDate(invoiceMonth: string, dueDay: number): Date {
  const [ano, mes] = invoiceMonth.split('-').map(Number);
  return new Date(ano, mes - 1, dueDay);
}

/** Retorna 'open' se a fatura ainda não fechou, 'closed' caso contrário. */
export function calcularStatusFatura(invoiceMonth: string, closingDay: number, dueDay: number): 'open' | 'closed' {
  const hoje = new Date();
  const [ano, mesVencimento] = invoiceMonth.split('-').map(Number);

  let mesFechamento = mesVencimento - 1; // zero-indexed
  if (dueDay < closingDay) {
    mesFechamento -= 1; // fechamento ocorreu no mês anterior ao de vencimento
  }

  let anoFechamento = ano;
  anoFechamento += Math.floor(mesFechamento / 12);
  mesFechamento = ((mesFechamento % 12) + 12) % 12;

  const dataFechamento = new Date(anoFechamento, mesFechamento, closingDay);
  return hoje < dataFechamento ? 'open' : 'closed';
}

/**
 * Faz o parse de uma data no formato "YYYY-MM-DD" como horário LOCAL,
 * evitando o bug clássico de `new Date(string)` interpretar como UTC
 * e "voltar um dia" em fusos horários negativos (como o Brasil).
 */
export function formatarDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function mesAtualISO(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

export function mesSeguinte(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  const data = new Date(ano, m, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

export function parseDataLocal(dateStr: string): Date {
  const [ano, mes, dia] = dateStr.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}