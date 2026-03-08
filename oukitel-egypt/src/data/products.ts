export const categories = [
    { id: "devices", name: "Devices", arabicName: "الأجهزة" },
    { id: "disposables", name: "Disposables", arabicName: "ديسبوزابل" },
    { id: "cartridges", name: "Cartridges", arabicName: "بودات / خراطيش" },
    { id: "coils", name: "Coils", arabicName: "كويلات" }
];

export const products = [
    {
        id: 1,
        name: "أوكيتيل نانو برو",
        price: "1,200",
        image: "/Oukitel-Mate-Max-4.jpg",
        categoryId: "devices",
        category: "Devices",
        rating: 4.8,
        description: "جهاز أوكيتيل نانو برو الذكي والمدمج، يقدم تجربة فيب استثنائية مع بطارية تدوم طويلاً وشحن سريع من نوع C. يتميز بتصميم عصري وخفيف الوزن يناسب الاستخدام اليومي.",
        features: ["بطارية 800mAh", "مؤشر LED ذكي", "شحن Type-C سريع", "سعة البود 2ml"]
    },
    {
        id: 2,
        name: "أوكيتيل ماكس 5000",
        price: "850",
        image: "/Oukitel-Mate-Clear-1.jpg",
        categoryId: "disposables",
        category: "Disposables",
        rating: 4.9,
        description: "فيب الاستعمال الواحد أوكيتيل ماكس يمنحك 5000 سحبة من النكهات الغنية والمكثفة. لا يحتاج لأي إعدادات، جاهز للاستخدام مباشرة مع مظهر خارجي أنيق ومريح في اليد.",
        features: ["5000 سحبة", "مشبك كويل شبكي (Mesh Coil)", "جاهز للاستخدام الفوري", "مجموعة نكهات استوائية"]
    },
    {
        id: 3,
        name: "خرطوشة أوكيتيل بود",
        price: "250",
        image: "/Oukitel-Mate-Max-5.jpg",
        categoryId: "cartridges",
        category: "Cartridges",
        rating: 4.7,
        description: "بودات احتياطية متوافقة بالكامل مع سلسلة أجهزة أوكيتيل. تأتي بتصميم يمنع التسريب تماماً ويوفر تدفق هواء سلس لتعزيز النكهة وعمر افتراضي طويل للكويل الداخلي.",
        features: ["مضاد للتسريب", "سعة 2 مل / 3 مل", "سهولة التعبئة الجانبية", "باقة من 3 قطع"]
    },
    {
        id: 4,
        name: "كويل أوكيتيل ميش",
        price: "150",
        image: "/Oukitel-Mate-Max-4.jpg",
        categoryId: "coils",
        category: "Coils",
        rating: 5.0,
        description: "كويلات شبكية (Mesh Coils) أصلية توفر توزيعاً حرارياً مثالياً للحصول على أنقى مذاق لسائل الفيب الخاص بك، بالإضافة إلى إنتاج كثيف للبخار.",
        features: ["مقاومة 0.8 / 1.2 أوم", "توصيل حراري سريع", "عمر افتراضي ممتاز", "نكهة معززة"]
    },
];
