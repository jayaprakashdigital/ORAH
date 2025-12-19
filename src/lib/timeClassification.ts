export type TimeCategory = 'Working Hours' | 'Non-Working Hours';

export function isWorkingHours(date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours();

  const isWeekday = day >= 1 && day <= 5;
  const isBusinessHours = hour >= 9 && hour < 18;

  return isWeekday && isBusinessHours;
}

export function getTimeCategory(dateString: string): TimeCategory {
  const date = new Date(dateString);
  return isWorkingHours(date) ? 'Working Hours' : 'Non-Working Hours';
}

export function getBudgetRange(budget: string | null): string {
  if (!budget) return 'Not specified';

  const budgetStr = budget.toLowerCase().replace(/[^0-9.]/g, '');
  const budgetNum = parseFloat(budgetStr);

  if (isNaN(budgetNum)) return 'Not specified';

  if (budgetNum < 70) return '< 70L';
  if (budgetNum < 100) return '70L - 1Cr';
  if (budgetNum < 150) return '1Cr - 1.5Cr';
  return '1.5Cr+';
}

export function formatDateForChart(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function getHourFromDate(dateString: string): number {
  const date = new Date(dateString);
  return date.getHours();
}
