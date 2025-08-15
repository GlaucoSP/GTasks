export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('pt-BR');
};

export const isOverdue = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  now.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < now;
};

export const getDaysUntilDeadline = (deadline) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  now.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};