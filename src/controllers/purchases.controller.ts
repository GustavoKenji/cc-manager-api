import { Request, Response } from 'express';
import { db } from '../firebase';
import { Card } from '../types';
import { calcularInvoiceMonth, calcularDueDate, parseDataLocal } from '../utils/invoice';

function cardRef(uid: string, cardId: string) {
  return db.collection('users').doc(uid).collection('cards').doc(cardId);
}

export async function createPurchase(req: Request, res: Response) {
  const { cardId } = req.params;
  const { description, totalAmount, purchaseDate, category, installmentsCount } = req.body as {
    description: string;
    totalAmount: number;
    purchaseDate: string; // ISO, ex: "2026-09-20"
    category?: string;
    installmentsCount?: number;
  };

  if (!description || !totalAmount || !purchaseDate) {
    return res.status(400).json({ error: 'Campos obrigatórios: description, totalAmount, purchaseDate' });
  }

  const ref = cardRef(req.uid!, cardId);
  const cardDoc = await ref.get();

  if (!cardDoc.exists) {
    return res.status(404).json({ error: 'Cartão não encontrado' });
  }

  const card = cardDoc.data() as Card;
  const parcelas = installmentsCount && installmentsCount > 0 ? installmentsCount : 1;
  const dataCompra = parseDataLocal(purchaseDate);
  const valorParcelaBase = Math.round((totalAmount / parcelas) * 100) / 100;

  const purchaseRef = ref.collection('purchases').doc();
  const batch = db.batch();

  batch.set(purchaseRef, {
    description,
    totalAmount,
    purchaseDate: dataCompra,
    category: category ?? null,
    installmentsCount: parcelas,
    createdAt: new Date(),
  });

  for (let i = 0; i < parcelas; i++) {
    const invoiceMonth = calcularInvoiceMonth(dataCompra, card.closingDay, card.dueDay, i);
    const dueDate = calcularDueDate(invoiceMonth, card.dueDay);
    const installmentRef = ref.collection('installments').doc();

    // A última parcela absorve a diferença de arredondamento, pra soma
    // das parcelas bater exatamente com o valor total da compra.
    const amount =
      i === parcelas - 1
        ? Math.round((totalAmount - valorParcelaBase * (parcelas - 1)) * 100) / 100
        : valorParcelaBase;

    batch.set(installmentRef, {
      purchaseId: purchaseRef.id,
      description,
      category: category ?? null,
      number: i + 1,
      totalInstallments: parcelas,
      amount,
      invoiceMonth,
      dueDate,
      status: 'pending',
    });
  }

  await batch.commit();

  const created = await purchaseRef.get();
  res.status(201).json({ id: created.id, ...created.data() });
}

export async function deletePurchase(req: Request, res: Response) {
  const { cardId, purchaseId } = req.params;
  const ref = cardRef(req.uid!, cardId);
  const purchaseRef = ref.collection('purchases').doc(purchaseId);
  const purchaseDoc = await purchaseRef.get();

  if (!purchaseDoc.exists) {
    return res.status(404).json({ error: 'Compra não encontrada' });
  }

  const installmentsSnapshot = await ref.collection('installments').where('purchaseId', '==', purchaseId).get();

  const batch = db.batch();
  installmentsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(purchaseRef);
  await batch.commit();

  res.status(204).send();
}
