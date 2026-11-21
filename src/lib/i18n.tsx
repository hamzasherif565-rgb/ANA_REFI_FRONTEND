import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "ar" | "en";

type Dict = Record<string, string>;

const dictionaries: Record<Locale, Dict> = {
  ar: {
    "app.name": "ANA Refi",
    "app.tagline": "From Village to the World",
    "nav.home": "الرئيسية",
    "nav.stays": "الإقامات",
    "nav.experiences": "التجارب",
    "nav.products": "المنتجات",
    "nav.competitions": "المسابقات",
    "nav.community": "المجتمع",
    "nav.volunteers": "التطوع",
    "nav.favorites": "المفضلة",
    "nav.notifications": "الإشعارات",
    "nav.signin": "تسجيل الدخول",
    "nav.signout": "تسجيل الخروج",
    "nav.dashboard": "لوحة التحكم",
    "comp.title": "المسابقات",
    "comp.subtitle": "اكتشف المسابقات الريفية واشترك ونافس على الجوائز",
    "comp.create": "إنشاء مسابقة",
    "comp.all": "كل المسابقات",
    "comp.mine": "مسابقاتي",
    "comp.favorites": "المفضلة",
    "comp.rentals": "إيجاراتي",
    "comp.search": "ابحث عن مسابقة...",
    "comp.allCategories": "كل الفئات",
    "comp.allPlaces": "كل الأماكن",
    "comp.allDates": "كل التواريخ",
    "comp.newest": "الأحدث أولاً",
    "comp.why": "لماذا تشارك؟",
    "comp.why.prizes": "اربح جوائز قيمة",
    "comp.why.experience": "اكتسب خبرة جديدة",
    "comp.why.people": "تعرف على أشخاص جدد",
    "comp.why.heritage": "ادعم التراث الريفي",
    "comp.subscribe": "اشترك الآن",
    "comp.fee": "رسوم الاشتراك",
    "comp.free": "مجاناً",
    "comp.egp": "جنيه",
    "comp.prize": "الجوائز",
    "comp.participants": "المشاركون",
    "comp.registrationClosed": "التسجيل مغلق",
    "comp.featured": "مميز",
    "comp.comingSoon": "قريباً ممتلئ",
    "cat.all": "كل المسابقات",
    "cat.horse_riding": "ركوب الخيل",
    "cat.agriculture": "الزراعة",
    "cat.pottery": "الفخار",
    "cat.handicrafts": "الأعمال اليدوية",
    "cat.popular_cooking": "الطبخ الشعبي",
    "cat.photography": "التصوير",
    "cat.other": "أخرى",
    "time.days": "أيام",
    "time.hours": "ساعة",
    "time.minutes": "دقيقة",
    "empty.competitions": "لا توجد مسابقات مطابقة لبحثك",
    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ ما",
    "common.retry": "إعادة المحاولة",
    "unit.night": "ليلة",
    "unit.person": "للشخص",
    "unit.item": "قطعة",
    "listing.book": "احجز",
    "listing.buy": "اشترِ",
    "stays.title": "الإقامات الريفية",
    "stays.subtitle": "بيوت طينية، مزارع نيلية، شاليهات وواحات",
    "experiences.title": "التجارب",
    "experiences.subtitle": "ورش، حرف، طبخ، ركوب خيل والمزيد",
    "products.title": "منتجات القرية",
    "products.subtitle": "حرف يدوية، عسل، زيت زيتون ومنتجات أصيلة",
    "community.title": "المجتمع",
    "community.subtitle": "قصص من قرى مصر: حرفيون، مضيفون، ومسافرون",
    "search.placeholder": "ابحث...",
    "sort.newest": "الأحدث",
    "sort.priceLow": "السعر: من الأقل",
    "sort.priceHigh": "السعر: من الأعلى",
    "sort.rating": "الأعلى تقييمًا",
    "auth.welcome": "مرحبًا في ANA Refi",
    "auth.signInTab": "تسجيل الدخول",
    "auth.signUpTab": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.name": "الاسم",
    "auth.signIn": "دخول",
    "auth.signUp": "إنشاء حساب",
    "auth.google": "المتابعة بجوجل",
    "auth.or": "أو",
    "auth.signedIn": "تم تسجيل الدخول بنجاح",
    "auth.checkEmail": "افحص بريدك لتفعيل الحساب",
    "auth.error": "فشل تسجيل الدخول",
    "dash.title": "لوحة التحكم",
    "dash.bookings": "حجوزاتي",
    "dash.favorites": "المفضلة",
    "dash.notifications": "الإشعارات",
    "dash.host": "أدوات المضيف",
    "dash.profile": "الملف الشخصي",
    "dash.signOut": "تسجيل الخروج",
    "dash.hostIntro": "أدر عقاراتك وتجاربك وحجوزاتك.",
    "dash.newListing": "إضافة عرض جديد",
    "dash.empty.bookings": "لا توجد حجوزات بعد.",
    "dash.empty.notifications": "لا توجد إشعارات.",
    "dash.empty.favorites": "لم تحفظ أي شيء بعد.",
    "chat.title": "مساعد ANA Refi الذكي",
    "chat.subtitle": "اسألني عن أي شيء ريفي في مصر",
    "chat.placeholder": "اكتب سؤالك...",
    "chat.typing": "جاري الكتابة...",
    "book.confirm": "تم إرسال الحجز، بانتظار تأكيد المضيف",
    "book.needSignIn": "سجل الدخول أولًا للحجز",
    "status.pending": "قيد الانتظار",
    "status.confirmed": "مؤكد",
    "status.cancelled": "ملغى",
    "status.completed": "مكتمل",
    "notif.markAllRead": "قراءة الكل",
    "notif.unread": "غير مقروء",
    "hero.stays": "بيوت ريفية أصيلة",
    "hero.experiences": "تجارب مع أهل القرية",
    "hero.products": "منتجات يدوية أصيلة",
    "hero.competitions": "نافس على جوائز",
  },
  en: {
    "app.name": "ANA REFI",
    "app.tagline": "From Village to the World",
    "nav.home": "Home",
    "nav.stays": "Stays",
    "nav.experiences": "Experiences",
    "nav.products": "Products",
    "nav.competitions": "Competitions",
    "nav.community": "Community",
    "nav.volunteers": "Volunteers",
    "nav.favorites": "Favorites",
    "nav.notifications": "Notifications",
    "nav.signin": "Sign in",
    "nav.signout": "Sign out",
    "nav.dashboard": "Dashboard",
    "comp.title": "Competitions",
    "comp.subtitle": "Discover rural competitions, join in, and compete for prizes",
    "comp.create": "Create competition",
    "comp.all": "All competitions",
    "comp.mine": "My competitions",
    "comp.favorites": "Favorites",
    "comp.rentals": "My rentals",
    "comp.search": "Search competitions...",
    "comp.allCategories": "All categories",
    "comp.allPlaces": "All places",
    "comp.allDates": "All dates",
    "comp.newest": "Newest first",
    "comp.why": "Why join?",
    "comp.why.prizes": "Win valuable prizes",
    "comp.why.experience": "Gain new experience",
    "comp.why.people": "Meet new people",
    "comp.why.heritage": "Support rural heritage",
    "comp.subscribe": "Join now",
    "comp.fee": "Entry fee",
    "comp.free": "Free",
    "comp.egp": "EGP",
    "comp.prize": "Prize",
    "comp.participants": "Participants",
    "comp.registrationClosed": "Registration closed",
    "comp.featured": "Featured",
    "comp.comingSoon": "Almost full",
    "cat.all": "All competitions",
    "cat.horse_riding": "Horse riding",
    "cat.agriculture": "Agriculture",
    "cat.pottery": "Pottery",
    "cat.handicrafts": "Handicrafts",
    "cat.popular_cooking": "Popular cooking",
    "cat.photography": "Photography",
    "cat.other": "Other",
    "time.days": "days",
    "time.hours": "h",
    "time.minutes": "m",
    "empty.competitions": "No competitions match your search",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.retry": "Retry",
    "unit.night": "night",
    "unit.person": "person",
    "unit.item": "item",
    "listing.book": "Book",
    "listing.buy": "Buy",
    "stays.title": "Rural stays",
    "stays.subtitle": "Mud-brick homes, Nile farms, chalets and oases",
    "experiences.title": "Experiences",
    "experiences.subtitle": "Workshops, crafts, cooking, horse riding and more",
    "products.title": "Village products",
    "products.subtitle": "Handmade crafts, honey, olive oil and authentic goods",
    "community.title": "Community",
    "community.subtitle": "Stories from Egyptian villages: artisans, hosts, and travelers",
    "search.placeholder": "Search...",
    "sort.newest": "Newest",
    "sort.priceLow": "Price: low to high",
    "sort.priceHigh": "Price: high to low",
    "sort.rating": "Top rated",
    "auth.welcome": "Welcome to ANA Refi",
    "auth.signInTab": "Sign in",
    "auth.signUpTab": "Create account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Name",
    "auth.signIn": "Sign in",
    "auth.signUp": "Create account",
    "auth.google": "Continue with Google",
    "auth.or": "or",
    "auth.signedIn": "Signed in successfully",
    "auth.checkEmail": "Check your email to confirm your account",
    "auth.error": "Sign in failed",
    "dash.title": "Dashboard",
    "dash.bookings": "My bookings",
    "dash.favorites": "Favorites",
    "dash.notifications": "Notifications",
    "dash.host": "Host tools",
    "dash.profile": "Profile",
    "dash.signOut": "Sign out",
    "dash.hostIntro": "Manage your listings, experiences and bookings.",
    "dash.newListing": "Add new listing",
    "dash.empty.bookings": "You have no bookings yet.",
    "dash.empty.notifications": "No notifications.",
    "dash.empty.favorites": "You haven't saved anything yet.",
    "chat.title": "ANA Refi assistant",
    "chat.subtitle": "Ask me anything about rural Egypt",
    "chat.placeholder": "Type your question...",
    "chat.typing": "Typing...",
    "book.confirm": "Booking submitted — awaiting host confirmation",
    "book.needSignIn": "Sign in first to book",
    "status.pending": "Pending",
    "status.confirmed": "Confirmed",
    "status.cancelled": "Cancelled",
    "status.completed": "Completed",
    "notif.markAllRead": "Mark all as read",
    "notif.unread": "Unread",
    "hero.stays": "Authentic countryside stays",
    "hero.experiences": "Immersive local workshops",
    "hero.products": "Handmade village products",
    "hero.competitions": "Compete for real prizes",
  },
};

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "anarefi.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as Locale | null)) ||
      null;
    if (stored === "ar" || stored === "en") setLocaleState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[locale];
    return {
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: (key: string) => dict[key] ?? key,
      setLocale: (l) => {
        setLocaleState(l);
        if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
      },
      toggleLocale: () => {
        const next = locale === "ar" ? "en" : "ar";
        setLocaleState(next);
        if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
