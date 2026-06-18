export const inr = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '₹—';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
