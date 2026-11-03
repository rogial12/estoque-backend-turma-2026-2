// Importa Product em tempo de execução para validar a entrada recebida.
import { Product } from './Product';

// Quantidade de milissegundos em um dia de 24 horas.
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// Representa uma entrada de produto; as datas usam o calendário de Brasília.
export class ProductInput {
    // Impede a criação direta sem passar pelas validações de create().
    private constructor(
        private readonly product: Product, // Produto recebido.
        private readonly dateOrder: Date, // Data e horário originais do pedido.
        private readonly dateInput: Date, // Data e horário originais da entrada.
        private readonly quantity: number, // Quantidade inteira recebida.
    ) {}

    // Valida os dados e retorna uma entrada ou um erro, como faz Product.create().
    public static create(
        product: Product, // Produto associado à entrada.
        dateOrder: Date, // Data do pedido.
        dateInput: Date, // Data do recebimento.
        quantity: number, // Quantidade de unidades recebidas.
    ): ProductInput | Error {
        // Garante que a entrada esteja associada a um produto válido.
        if (!(product instanceof Product)) {
            return new Error('Product is invalid');
        }
        // Rejeita valores que não sejam datas ou sejam datas inválidas.
        if (!(dateOrder instanceof Date) || Number.isNaN(dateOrder.getTime())) {
            return new Error('Order date is invalid');
        }
        // Aplica a mesma validação à data da entrada.
        if (!(dateInput instanceof Date) || Number.isNaN(dateInput.getTime())) {
            return new Error('Input date is invalid');
        }
        // A era é determinada pelo dia civil em Brasília, não pelo fuso da máquina.
        if (ProductInput.isBeforeCommonEra(dateOrder)) {
            return new Error('Order date cannot be before the common era');
        }
        if (ProductInput.isBeforeCommonEra(dateInput)) {
            return new Error('Input date cannot be before the common era');
        }
        // Compara os dias de Brasília, ignorando o horário em ambas as datas.
        if (ProductInput.calendarDay(dateInput) < ProductInput.calendarDay(dateOrder)) {
            return new Error('Input date cannot be before order date');
        }
        // Exige uma quantidade inteira, positiva e representável com precisão.
        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            return new Error('Quantity must be a positive integer');
        }

        // Cria a entidade com cópias das datas, evitando alterações externas.
        return new ProductInput(
            product,
            new Date(dateOrder.getTime()),
            new Date(dateInput.getTime()),
            quantity,
        );
    }

    // Retorna o produto associado à entrada.
    public getProduct(): Product {
        return this.product;
    }

    // Retorna uma cópia da data do pedido para proteger o estado interno.
    public getDateOrder(): Date {
        return new Date(this.dateOrder.getTime());
    }

    // Retorna uma cópia da data da entrada pelo mesmo motivo.
    public getDateInput(): Date {
        return new Date(this.dateInput.getTime());
    }

    // Retorna a quantidade recebida.
    public getQuantity(): number {
        return this.quantity;
    }

    // Calcula a diferença entre os dias de Brasília, sem incluir o dia inicial.
    public leadTime(): number {
        // Subtrai os dias normalizados e converte a diferença para dias.
        return (ProductInput.calendarDay(this.dateInput) - ProductInput.calendarDay(this.dateOrder))
            / MILLISECONDS_PER_DAY;
    }

    // Converte o dia de calendário de Brasília em um número para comparação.
    private static calendarDay(date: Date): number {
        // Extrai ano, mês e dia no fuso de Brasília, incluindo suas regras históricas.
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Sao_Paulo',
            calendar: 'gregory',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        }).formatToParts(date);
        // Recupera cada componente numérico produzido pelo formatador.
        const year = Number(parts.find(part => part.type === 'year')!.value);
        const month = Number(parts.find(part => part.type === 'month')!.value);
        const day = Number(parts.find(part => part.type === 'day')!.value);
        // Usa UTC somente como escala aritmética para a data civil já extraída.
        const calendarDate = new Date(0);
        calendarDate.setUTCFullYear(year, month - 1, day);
        return calendarDate.getTime();
    }

    // Identifica datas anteriores ao ano 1 no calendário civil de Brasília.
    private static isBeforeCommonEra(date: Date): boolean {
        const era = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Sao_Paulo',
            calendar: 'gregory',
            era: 'short',
            year: 'numeric',
        }).formatToParts(date).find(part => part.type === 'era')!.value;
        return era === 'BC';
    }
}
