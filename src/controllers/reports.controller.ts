import { Request, Response } from 'express';
import { db } from '../firebase';
import { Card, Installment } from '../types';
import { calcularDueDate, formatarDataISO } from '../utils/invoice';

export async function getInvoicesReport(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };

  if (!from || !to) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios: from e to (formato YYYY-MM-DD)' });
  }

  const cardsSnapshot = await db.collection('users').doc(req.uid!).collection('cards').get();

  const resultados: {
    cardId: string;
    cardName: string;
    cardColor: string;
    invoiceMonth: string;
    dueDate: string;
    total: number;
  }[] = [];

  for (const cardDoc of cardsSnapshot.docs) {
    const card = cardDoc.data() as Card;
    const installmentsSnapshot = await cardDoc.ref.collection('installments').get();

    // Agrupa todas as parcelas do cartão por invoiceMonth, pra examinar
    // cada fatura (passada, atual ou futura) de uma vez só.
    const porMes = new Map<string, Installment[]>();
    installmentsSnapshot.docs.forEach((doc) => {
      const installment = doc.data() as Installment;
      const lista = porMes.get(installment.invoiceMonth) ?? [];
      lista.push(installment);
      porMes.set(installment.invoiceMonth, lista);
    });

    for (const [invoiceMonth, installments] of porMes) {
      const paga = installments.every((i) => i.status === 'paid');
      if (paga) continue; // já decidimos excluir faturas pagas do relatório

      const dueDateISO = formatarDataISO(calcularDueDate(invoiceMonth, card.dueDay));
      if (dueDateISO < from || dueDateISO > to) continue;

      const total = installments.reduce((sum, i) => sum + i.amount, 0);

      resultados.push({
        cardId: cardDoc.id,
        cardName: card.name,
        cardColor: card.color,
        invoiceMonth,
        dueDate: dueDateISO,
        total: Math.round(total * 100) / 100,
      });
    }
  }

  resultados.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  res.json(resultados);
}