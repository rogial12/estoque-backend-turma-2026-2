
import { Product } from './Product';


const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;


export class ProductInput {
    
    private constructor(
        private readonly product: Product, 
        private readonly dateOrder: Date, 
        private readonly dateInput: Date, 
        private readonly quantity: number, 
    ) {}

    
    public static create(
        product: Product, 
        dateOrder: Date, 
        dateInput: Date, 
        quantity: number, 
    ): ProductInput | Error {
       
        if (!(product instanceof Product)) {
            return new Error('Product is invalid');
        }
        
        if (!(dateOrder instanceof Date) || Number.isNaN(dateOrder.getTime())) {
            return new Error('Order date is invalid');
        }
      
        if (!(dateInput instanceof Date) || Number.isNaN(dateInput.getTime())) {
            return new Error('Input date is invalid');
        }
      
        if (ProductInput.isBeforeCommonEra(dateOrder)) {
            return new Error('Order date cannot be before the common era');
        }
        if (ProductInput.isBeforeCommonEra(dateInput)) {
            return new Error('Input date cannot be before the common era');
        }
       
        if (ProductInput.calendarDay(dateInput) < ProductInput.calendarDay(dateOrder)) {
            return new Error('Input date cannot be before order date');
        }
      
        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            return new Error('Quantity must be a positive integer');
        }

       
        return new ProductInput(
            product,
            new Date(dateOrder.getTime()),
            new Date(dateInput.getTime()),
            quantity,
        );
    }

  
    public getProduct(): Product {
        return this.product;
    }

   
    public getDateOrder(): Date {
        return new Date(this.dateOrder.getTime());
    }

   
    public getDateInput(): Date {
        return new Date(this.dateInput.getTime());
    }

 
    public getQuantity(): number {
        return this.quantity;
    }

    
    public leadTime(): number {
       
        return (ProductInput.calendarDay(this.dateInput) - ProductInput.calendarDay(this.dateOrder))
            / MILLISECONDS_PER_DAY;
    }

   
    private static calendarDay(date: Date): number {
   
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Sao_Paulo',
            calendar: 'gregory',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        }).formatToParts(date);
   
        const year = Number(parts.find(part => part.type === 'year')!.value);
        const month = Number(parts.find(part => part.type === 'month')!.value);
        const day = Number(parts.find(part => part.type === 'day')!.value);
    
        const calendarDate = new Date(0);
        calendarDate.setUTCFullYear(year, month - 1, day);
        return calendarDate.getTime();
    }

   
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
