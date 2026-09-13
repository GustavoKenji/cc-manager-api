import { Request, Response } from 'express';
import { db } from '../firebase';
import { Card, Installment, InstallmentStatus } from '../types';
import { calcularStatusFatura } from '../utils/invoice';

function cardRef(uid: string, cardId: string) {
  return db.collection('users').doc(uid).collection('cards').doc(cardId);
}

export async function getInvoice(req: Request, res: Response) {
  const { cardId, month } = req.params;
  const ref = cardRef(req.uid!, cardId);
  const cardDoc = await ref.get();

  if (!cardDoc.exists) {
    return res.status(404).json({ error: 'Cartão não encontrado' });
  }

  const card = cardDoc.data() as Card;
  const snapshot = await ref.collection('installments').where('invoiceMonth', '==', month).orderBy('number').get();

  const installments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Installment & { id: string }));
  const total = installments.reduce((sum, item) => sum + item.amount, 0);

  const status =
    installments.length > 0 && installments.every((i) => i.status === 'paid')
      ? 'paid'
      : calcularStatusFatura(month, card.closingDay);

  res.json({ month, total: Math.round(total * 100) / 100, status, installments });
}

export async function listInvoiceMonths(req: Request, res: Response) {
  const { cardId } = req.params;
  const ref = cardRef(req.uid!, cardId);
  const snapshot = await ref.collection('installments').get();

  const months = new Set<string>();
  snapshot.docs.forEach((doc) => months.add(doc.data().invoiceMonth as string));

  res.json([...months].sort());
}

export async function updateInstallmentStatus(req: Request, res: Response) {
  const { cardId, installmentId } = req.params;
  const { status } = req.body as { status: InstallmentStatus };

  if (status !== 'pending' && status !== 'paid') {
    return res.status(400).json({ error: 'status deve ser "pending" ou "paid"' });
  }

  const ref = cardRef(req.uid!, cardId).collection('installments').doc(installmentId);
  const doc = await ref.get();

  if (!doc.exists) {
    return res.status(404).json({ error: 'Parcela não encontrada' });
  }

  await ref.update({ status });
  const updated = await ref.get();
  res.json({ id: updated.id, ...updated.data() });
}

export async function updateInvoiceStatus(req: Request, res: Response) {
  const { cardId, month } = req.params;
  const { status } = req.body as { status: InstallmentStatus };

  if (status !== 'pending' && status !== 'paid') {
    return res.status(400).json({ error: 'status deve ser "pending" ou "paid"' });
  }

  const ref = cardRef(req.uid!, cardId);
  const snapshot = await ref.collection('installments').where('invoiceMonth', '==', month).get();

  if (snapshot.empty) {
    return res.status(404).json({ error: 'Fatura sem parcelas para atualizar' });
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.update(doc.ref, { status }));
  await batch.commit();

  res.json({ month, status, updated: snapshot.size });
}