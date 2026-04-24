export type FundPrice = {
    fundName: string;
    date: string;
    classA: number;
    classB: number;
    classC: number;
};

export type Investor = {
    customerId: string;
    name: string;
    idNumber: string | null;
    contactPerson: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    leiCode: string | null;
    customerType: 'Aksjeselskap';
    category: 'Professional';
};

export type Trade = {
    id: string;
    customerId: string;
    customerName: string | null;
    fundName: string | null;
    shareClass: string | null;
    tradeDate: string | null;
    settlementDate: string | null;
    transactionType:
        | 'Andre kostnader'
        | 'Kildeskatt'
        | 'Kjøp'
        | 'Kostnadsførte kjøpsomk.'
        | 'Realisert valutatap (Disagio)'
        | 'Salg'
        | 'Tildelt ved aksjesplitt'
        | 'Urealisert gevinst'
        | 'Urealisert tap'
        | 'Utbytte'
        | null;
    units: number | null;
    price: number | null;
    amount: number | null;
    unitEffect: number | null;
};
