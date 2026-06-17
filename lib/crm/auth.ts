// Emails autorizados a acessar o painel CRM
// Adicione o email da sua esposa e do seu pai aqui
export const CRM_ALLOWED_EMAILS = [
  "jeffersonbrito86@gmail.com",
  // "email-da-esposa@gmail.com",
  // "email-do-pai@gmail.com",
];

export function isCrmUser(email: string | undefined | null): boolean {
  if (!email) return false;
  return CRM_ALLOWED_EMAILS.includes(email.toLowerCase());
}
