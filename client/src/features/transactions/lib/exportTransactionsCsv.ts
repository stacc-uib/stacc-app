import type { Transaction } from "../types/transactions";

function formatDate(iso: string | null) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
}

export const exportTransactionsCsv = (transactions: Transaction[]) => {
    const headers = ['ID', 'Kunde', 'Dato', 'Oppgjørsdato', 'Status', 'Type', 'Antall', 'Kurs', 'Beløp', 'Fond', 'Klasse'];

    const rows = transactions.map((tx) => [
        tx.id,
        tx.customerName ?? '',
        formatDate(tx.tradeDate),
        formatDate(tx.settlementDate),
        tx.settlementDate ? 'Oppgjort' : 'Ikke oppgjort',
        tx.transactionType ?? '',
        tx.units ?? '',
        tx.price ?? '',
        tx.amount ?? '',
        tx.fundName ?? '',
        tx.shareClass ?? '',
    ]);

    const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksjoner_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};
