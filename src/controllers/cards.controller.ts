import { Request, Response } from 'express';
import { db } from '../firebase';
import { Card } from '../types';
import { calcularDueDate, formatarDataISO, mesAtualISO, mesSeguinte } from '../utils/invoice';

function cardsCollection(uid: string) {
  return db.collection('users').doc(uid).collection('cards');
}

async function calcularCreditoDisponivel(uid: string, cardId: string, limit: number): Promise<number> {
  const snapshot = await cardsCollection(uid)
    .doc(cardId)
    .collection('installments')
    .where('status', '==', 'pending')
    .get();
  const usado = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
  return Math.round((limit - usado) * 100) / 100;
}

/**
 * A fatura vigente é a do mês corrente, enquanto não estiver totalmente
 * paga. Só avança pra próxima quando a atual é quitada — não quando o
 * fechamento passa, ou quando nao houver lançamentos. Isso evita "pular" uma fatura fechada e ainda não paga.
 */
async function calcularFaturaVigente(uid: string, cardId: string) {
  const snapshot = await cardsCollection(uid).doc(cardId).collection('installments').get();

  const porMes = new Map<string, { amount: number; status: string }[]>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as { invoiceMonth: string; amount: number; status: string };
    const lista = porMes.get(data.invoiceMonth) ?? [];
    lista.push({ amount: data.amount, status: data.status });
    porMes.set(data.invoiceMonth, lista);
  });

  const mesCorrente = mesAtualISO();
  const mesesComLancamento = [...porMes.keys()].filter((mes) => mes >= mesCorrente).sort();

  for (const mes of mesesComLancamento) {
    const installments = porMes.get(mes)!;
    const paga = installments.every((i) => i.status === 'paid');

    if (!paga) {
      const total = installments.reduce((sum, i) => sum + i.amount, 0);
      return { invoiceMonth: mes, total: Math.round(total * 100) / 100, paga: false };
    }
  }

  // Nenhuma fatura pendente a partir de hoje (tudo pago, ou nada lançado ainda)
  return { invoiceMonth: mesCorrente, total: 0, paga: true };
}

export async function listCards(req: Request, res: Response) {
  const snapshot = await cardsCollection(req.uid!).orderBy('createdAt', 'desc').get();
  const cards = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const card = doc.data() as Card;
      const [availableCredit, fatura] = await Promise.all([
        calcularCreditoDisponivel(req.uid!, doc.id, card.limit),
        calcularFaturaVigente(req.uid!, doc.id),
      ]);
      const dataVencimento = calcularDueDate(fatura.invoiceMonth, card.dueDay);

      return {
        id: doc.id,
        ...card,
        availableCredit,
        currentInvoiceMonth: fatura.invoiceMonth,
        currentInvoiceTotal: fatura.total,
        currentInvoiceStatus: fatura.paga ? 'paid' : 'pending',
        currentInvoiceDueDate: formatarDataISO(dataVencimento),
      };
    })
  );
  res.json(cards);
}

export async function getCard(req: Request, res: Response) {
  const doc = await cardsCollection(req.uid!).doc(req.params.cardId).get();

  if (!doc.exists) {
    return res.status(404).json({ error: 'Cartão não encontrado' });
  }

  const card = doc.data() as Card;
  const [availableCredit, fatura] = await Promise.all([
    calcularCreditoDisponivel(req.uid!, doc.id, card.limit),
    calcularFaturaVigente(req.uid!, doc.id),
  ]);

  const dataVencimento = calcularDueDate(fatura.invoiceMonth, card.dueDay);

  res.json({
    id: doc.id,
    ...card,
    availableCredit,
    currentInvoiceMonth: fatura.invoiceMonth,
    currentInvoiceTotal: fatura.total,
    currentInvoiceStatus: fatura.paga ? 'paid' : 'pending',
    currentInvoiceDueDate: formatarDataISO(dataVencimento),
  });
}

export async function createCard(req: Request, res: Response) {
  const { name, bank, lastFourDigits, limit, closingDay, dueDay, color } = req.body as Card;

  if (!name || !bank || !limit || !closingDay || !dueDay) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, bank, limit, closingDay, dueDay' });
  }

  if (closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) {
    return res.status(400).json({ error: 'closingDay e dueDay devem estar entre 1 e 31' });
  }

  const now = new Date();
  const docRef = await cardsCollection(req.uid!).add({
    name,
    bank,
    lastFourDigits: lastFourDigits ?? null,
    limit,
    closingDay,
    dueDay,
    color: color ?? '#888888',
    createdAt: now,
    updatedAt: now,
  });

  const created = await docRef.get();
  res.status(201).json({ id: created.id, ...created.data() });
}

export async function updateCard(req: Request, res: Response) {
  const ref = cardsCollection(req.uid!).doc(req.params.cardId);
  const doc = await ref.get();

  if (!doc.exists) {
    return res.status(404).json({ error: 'Cartão não encontrado' });
  }

  const { name, bank, lastFourDigits, limit, closingDay, dueDay, color } = req.body as Partial<Card>;

  await ref.update({
    ...(name !== undefined && { name }),
    ...(bank !== undefined && { bank }),
    ...(lastFourDigits !== undefined && { lastFourDigits }),
    ...(limit !== undefined && { limit }),
    ...(closingDay !== undefined && { closingDay }),
    ...(dueDay !== undefined && { dueDay }),
    ...(color !== undefined && { color }),
    updatedAt: new Date(),
  });

  const updated = await ref.get();
  res.json({ id: updated.id, ...updated.data() });
}

export async function deleteCard(req: Request, res: Response) {
  const ref = cardsCollection(req.uid!).doc(req.params.cardId);
  const doc = await ref.get();

  if (!doc.exists) {
    return res.status(404).json({ error: 'Cartão não encontrado' });
  }

  // Apaga em cascata: purchases e installments dentro do cartão.
  // Para poucos documentos (uso pessoal) um loop simples é suficiente;
  // se crescer muito, trocar por batches de até 500 operações.
  const purchases = await ref.collection('purchases').listDocuments();
  const installments = await ref.collection('installments').listDocuments();

  const batch = db.batch();
  purchases.forEach((docRef) => batch.delete(docRef));
  installments.forEach((docRef) => batch.delete(docRef));
  batch.delete(ref);

  await batch.commit();
  res.status(204).send();
}
