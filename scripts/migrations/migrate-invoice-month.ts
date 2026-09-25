// scripts/migrations/2026-09-24-invoice-month-fix.ts
throw new Error(
  'Esta migração já foi executada em produção. Remova esta linha manualmente se tiver certeza que precisa rodar de novo.',
);

// script do .env
// "migrate:invoice-month": "tsx scripts/migrate-invoice-month.ts"

// codigo font do script
// import { config } from 'dotenv';
// import path from 'path';

// config({ path: path.resolve(__dirname, '../.env') });

// const dryRun = process.argv.includes('--dry-run');

// async function migrar() {
//   const { admin, db } = await import('../src/firebase');
//   const { calcularDueDate, mesSeguinte } = await import('../src/utils/invoice');

//   console.log('Projeto conectado:', admin.app().options.projectId ?? '(não detectado)');

//   const cardsSnapshot = await db.collectionGroup('cards').get();
//   console.log(`Cartões encontrados (todos os usuários): ${cardsSnapshot.size}`);

//   let totalAtualizado = 0;

//   for (const cardDoc of cardsSnapshot.docs) {
//     const card = cardDoc.data() as { name: string; closingDay: number; dueDay: number };
//     console.log(`Cartão "${card.name}": closingDay=${card.closingDay}, dueDay=${card.dueDay}`);

//     if (card.dueDay >= card.closingDay) continue;

//     const installmentsSnapshot = await cardDoc.ref.collection('installments').get();
//     if (installmentsSnapshot.empty) continue;

//     console.log(`  → ${installmentsSnapshot.size} parcela(s) a migrar:`);

//     const batch = db.batch();
//     installmentsSnapshot.docs.forEach((doc) => {
//       const installment = doc.data() as {
//         description: string;
//         number: number;
//         totalInstallments: number;
//         invoiceMonth: string;
//       };
//       const novoInvoiceMonth = mesSeguinte(installment.invoiceMonth);
//       const novoDueDate = calcularDueDate(novoInvoiceMonth, card.dueDay);

//       console.log(
//         `    ${installment.description} (${installment.number}/${installment.totalInstallments}): ` +
//           `${installment.invoiceMonth} → ${novoInvoiceMonth}`,
//       );

//       if (!dryRun) {
//         batch.update(doc.ref, { invoiceMonth: novoInvoiceMonth, dueDate: novoDueDate });
//       }
//     });

//     if (!dryRun) {
//       await batch.commit();
//     }
//     totalAtualizado += installmentsSnapshot.size;
//   }

//   console.log(
//     `\n${dryRun ? '[SIMULAÇÃO] ' : ''}Concluído. ${totalAtualizado} parcela(s) ${dryRun ? 'seriam atualizadas' : 'atualizadas'}.`,
//   );
// }

// migrar()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error('Erro na migração:', err);
//     process.exit(1);
//   });