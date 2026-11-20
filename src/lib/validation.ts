export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Egyptian mobile: +201x xxxxxxxx / 01x xxxxxxxx
export const egPhoneRe = /^(?:\+?20|0)?1[0125]\d{8}$/;
export const nationalIdRe = /^\d{14}$/;

export function validateSignup(v: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  confirm?: string;
  nationalId?: string;
  requirePassword?: boolean;
}, ar: boolean): string | null {
  const m = (a: string, e: string) => (ar ? a : e);
  if (!v.firstName.trim()) return m("الاسم الأول مطلوب", "First name is required");
  if (!v.lastName.trim()) return m("اسم العائلة مطلوب", "Last name is required");
  if (!emailRe.test(v.email.trim())) return m("صيغة البريد الإلكتروني غير صحيحة", "Invalid email address");
  if (!egPhoneRe.test(v.phone.replace(/[\s-]/g, ""))) return m("رقم موبايل مصري غير صحيح", "Invalid Egyptian mobile number");
  if (v.nationalId !== undefined && !nationalIdRe.test(v.nationalId.trim()))
    return m("الرقم القومي يجب أن يكون 14 رقمًا", "National ID must be exactly 14 digits");
  if (v.requirePassword) {
    if (!v.password || v.password.length < 8) return m("كلمة المرور 8 أحرف على الأقل", "Password must be at least 8 characters");
    if (v.password !== v.confirm) return m("كلمتا المرور غير متطابقتين", "Passwords do not match");
  }
  return null;
}