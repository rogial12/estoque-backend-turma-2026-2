import { Product } from '../../src/entities/Product';
import { ProductInput } from '../../src/entities/ProductInput';

describe('ProductInput entity', () => {
    const product = Product.create('1234567890123', 'Coca-Cola 2L');

    test('should create a product input with valid properties', () => {
        expect(product).toBeInstanceOf(Product);
        if (!(product instanceof Product)) {
            return;
        }

        const dateOrder = new Date(2026, 0, 10);
        const dateInput = new Date(2026, 0, 15);
        const productInput = ProductInput.create(product, dateOrder, dateInput, 20);

        expect(productInput).toBeInstanceOf(ProductInput);
        if (productInput instanceof ProductInput) {
            expect(productInput.getProduct()).toBe(product);
            expect(productInput.getDateOrder()).toEqual(dateOrder);
            expect(productInput.getDateInput()).toEqual(dateInput);
            expect(productInput.getQuantity()).toBe(20);
        }
    });

    test('should calculate lead time in days', () => {
        expect(product).toBeInstanceOf(Product);
        if (!(product instanceof Product)) {
            return;
        }

        const productInput = ProductInput.create(
            product,
            new Date('2026-01-10T23:59:00-03:00'),
            new Date('2026-01-15T01:00:00-03:00'),
            20,
        );

        expect(productInput).toBeInstanceOf(ProductInput);
        if (productInput instanceof ProductInput) {
            expect(productInput.leadTime()).toBe(5);
        }
    });

    test.each([
        ['quantity must be positive', 0, 'Quantity must be a positive integer'],
        ['quantity must be an integer', 1.5, 'Quantity must be a positive integer'],
    ])('should reject invalid %s', (_description, quantity, message) => {
        expect(product).toBeInstanceOf(Product);
        if (!(product instanceof Product)) {
            return;
        }

        const productInput = ProductInput.create(
            product,
            new Date(2026, 0, 10),
            new Date(2026, 0, 15),
            quantity,
        );

        expect(productInput).toBeInstanceOf(Error);
        if (productInput instanceof Error) {
            expect(productInput.message).toBe(message);
        }
    });

    test('should reject an input date before the order date', () => {
        expect(product).toBeInstanceOf(Product);
        if (!(product instanceof Product)) {
            return;
        }

        const productInput = ProductInput.create(
            product,
            new Date(2026, 0, 15),
            new Date(2026, 0, 10),
            20,
        );

        expect(productInput).toBeInstanceOf(Error);
        if (productInput instanceof Error) {
            expect(productInput.message).toBe('Input date cannot be before order date');
        }
    });

    test('should reject a missing product', () => {
        const result = ProductInput.create(null as unknown as Product, new Date(), new Date(), 1);
        expect(result).toEqual(new Error('Product is invalid'));
    });

    test.each([
        ['order', new Date('-000001-01-10T12:00:00Z'), new Date('0001-01-10T12:00:00Z'), 'Order date cannot be before the common era'],
        ['input', new Date('0001-01-10T12:00:00Z'), new Date('-000001-01-10T12:00:00Z'), 'Input date cannot be before the common era'],
    ])('should reject a date before the common era in %s', (_field, order, input, message) => {
        if (!(product instanceof Product)) throw new Error('Invalid test product');
        expect(ProductInput.create(product, order, input, 1)).toEqual(new Error(message));
    });

    test('should accept the first day of the common era in Brasília', () => {
        if (!(product instanceof Product)) throw new Error('Invalid test product');
        const firstDay = new Date('0001-01-01T12:00:00Z');
        const result = ProductInput.create(product, firstDay, firstDay, 1);
        expect(result).toBeInstanceOf(ProductInput);
        if (result instanceof ProductInput) expect(result.leadTime()).toBe(0);
    });

    test('should reject a date that is still BC in Brasília at the UTC new year', () => {
        if (!(product instanceof Product)) throw new Error('Invalid test product');
        const result = ProductInput.create(product, new Date('0001-01-01T00:00:00Z'), new Date('0001-01-01T12:00:00Z'), 1);
        expect(result).toEqual(new Error('Order date cannot be before the common era'));
    });

    test.each([
        [new Date('invalid'), new Date('2026-01-01T00:00:00Z'), 'Order date is invalid'],
        [new Date('2026-01-01T00:00:00Z'), new Date('invalid'), 'Input date is invalid'],
    ])('should reject invalid dates', (order, input, message) => {
        if (!(product instanceof Product)) throw new Error('Invalid test product');
        expect(ProductInput.create(product, order, input, 1)).toEqual(new Error(message));
    });

    test.each([
        ['same Brasília day, earlier time', '2026-01-10T23:00:00-03:00', '2026-01-10T01:00:00-03:00', 0],
        ['across months and years', '2025-12-31T23:00:00-03:00', '2026-01-02T01:00:00-03:00', 2],
        ['before the Unix epoch', '1969-12-31T23:00:00-03:00', '1970-01-01T00:00:00-03:00', 1],
        ['leap day', '2024-02-28T12:00:00-03:00', '2024-03-01T12:00:00-03:00', 2],
        ['different UTC days but same Brasília day', '2026-01-10T23:00:00-03:00', '2026-01-10T01:00:00-03:00', 0],
        ['same UTC day but different Brasília days', '2026-01-10T23:00:00-03:00', '2026-01-11T01:00:00-03:00', 1],
        ['historical daylight saving time', '2018-11-03T23:30:00-03:00', '2018-11-04T01:30:00-02:00', 1],
    ])('should calculate calendar days: %s', (_description, order, input, days) => {
        if (!(product instanceof Product)) throw new Error('Invalid test product');
        const result = ProductInput.create(product, new Date(order), new Date(input), 1);
        expect(result).toBeInstanceOf(ProductInput);
        if (result instanceof ProductInput) expect(result.leadTime()).toBe(days);
    });

    test('should reject an earlier Brasília date even when UTC dates match', () => {
        if (!(product instanceof Product)) throw new Error('Invalid test product');
        const result = ProductInput.create(product,
            new Date('2026-01-11T01:00:00-03:00'),
            new Date('2026-01-10T23:00:00-03:00'), 1);
        expect(result).toEqual(new Error('Input date cannot be before order date'));
    });

    test.each([-1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('should reject invalid quantity %s', (quantity) => {
        if (!(product instanceof Product)) throw new Error('Invalid test product');
        expect(ProductInput.create(product, new Date(), new Date(), quantity))
            .toEqual(new Error('Quantity must be a positive integer'));
    });

    test('should protect dates from changes to arguments and returned values', () => {
        if (!(product instanceof Product)) throw new Error('Invalid test product');
        const order = new Date('2026-01-10T00:00:00Z');
        const input = new Date('2026-01-15T00:00:00Z');
        const result = ProductInput.create(product, order, input, 1);
        expect(result).toBeInstanceOf(ProductInput);
        if (!(result instanceof ProductInput)) return;

        order.setUTCFullYear(2000);
        input.setUTCFullYear(2000);
        result.getDateOrder().setUTCFullYear(2001);
        result.getDateInput().setUTCFullYear(2001);

        expect(result.getDateOrder().toISOString()).toBe('2026-01-10T00:00:00.000Z');
        expect(result.getDateInput().toISOString()).toBe('2026-01-15T00:00:00.000Z');
        expect(result.leadTime()).toBe(5);
    });
});
