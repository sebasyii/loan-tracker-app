/**
 * Database seeding script
 *
 * Run with: pnpm db:seed
 *
 * This populates the database with initial data:
 * - Default property information
 * - Initial borrower split (50/50)
 * - Example transactions
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { propertyInfo, borrowerSplits, transactions } from './schema';
import * as schema from './schema';

// Load DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set in .env file');
}

// Create database connection for seeding
const client = new Database(DATABASE_URL);
const db = drizzle(client, { schema });

async function seed() {
	console.log('🌱 Seeding database...');

	// Clear existing data (for development)
	console.log('📝 Clearing existing data...');
	await db.delete(transactions);
	await db.delete(borrowerSplits);
	await db.delete(propertyInfo);

	// Seed property info (amounts in cents)
	console.log('🏠 Seeding property info...');
	await db.insert(propertyInfo).values({
		id: 'default',
		name: 'EC at Punggol',
		basePrice: 65000000, // $650,000 * 100
		buyerStampDuty: 1960000, // $19,600 * 100
		otherFees: 500000 // $5,000 * 100
	});

	// Seed initial borrower split (50/50 from project start)
	console.log('👥 Seeding borrower splits...');
	await db.insert(borrowerSplits).values({
		effectiveFrom: '2024-01-01',
		mePercent: 50,
		spousePercent: 50
	});

	// Seed example transactions (amounts in cents)
	console.log('💰 Seeding transactions...');
	await db.insert(transactions).values([
		{
			date: '2024-01-15',
			type: 'helper_disbursement',
			category: 'booking_fee',
			paidBy: 'helper',
			amount: 500000, // $5,000 * 100
			description: 'Initial booking fee'
		},
		{
			date: '2024-02-01',
			type: 'helper_disbursement',
			category: 'down_payment',
			paidBy: 'helper',
			amount: 10000000, // $100,000 * 100
			description: 'Down payment to developer'
		},
		{
			date: '2024-02-15',
			type: 'helper_disbursement',
			category: 'stamp_duty',
			paidBy: 'helper',
			amount: 2000000, // $20,000 * 100
			description: 'Buyer stamp duty payment'
		},
		{
			date: '2024-03-15',
			type: 'interest_charge',
			category: 'interest',
			paidBy: 'helper',
			amount: 325000, // $3,250 * 100
			description: 'Q1 2024 bank loan interest'
		},
		{
			date: '2024-04-01',
			type: 'repayment',
			category: 'repayment',
			paidBy: 'me',
			amount: 2000000, // $20,000 * 100
			description: 'First repayment from Me'
		},
		{
			date: '2024-04-15',
			type: 'repayment',
			category: 'repayment',
			paidBy: 'spouse',
			amount: 1000000, // $10,000 * 100
			description: 'First repayment from Spouse'
		}
	]);

	console.log('✅ Database seeded successfully!');
	console.log('\nSummary:');
	console.log('- 1 property');
	console.log('- 1 borrower split configuration');
	console.log('- 6 transactions');
	console.log('\nRun `pnpm db:studio` to view the data');

	process.exit(0);
}

seed().catch((error) => {
	console.error('❌ Seeding failed:', error);
	process.exit(1);
});
