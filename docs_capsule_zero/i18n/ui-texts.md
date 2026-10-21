# UI Texts — Capsule Zero (i18n)

> **Update 2026-10-19:** Current guest onboarding EN/RU copy is ported from reference commit 8328dca in spec 055; canonical runtime keys are `guest` in `app/src/messages/{en,ru}.json`, including `typeMixed`. Landing subtitle now describes ticking owned presets; primary CTA opens `/start`.

> Exact UI text strings in documented product languages. Active implementation scope is governed by the locale decision below.
> Source: Styling Guide v1.3, Section 7 + Phase 4 audit (2026-03-20).
> Coverage: all 16 logical screens.
> Locale scope decision, 2026-06-07: active v0.1 locales are EN and RU. ES-AR copy is retained here as v0.2 reference material only and must not be exposed in active routing, profile language persistence, or generated API clients until Spanish is reactivated for v0.2.

## Guided Journey — Step 1: Wardrobe Type

| Element  | EN                                                     | ES-AR                                     | RU                                      |
| -------- | ------------------------------------------------------ | ----------------------------------------- | --------------------------------------- |
| Title    | Choose your wardrobe type                              | Elegí tu tipo de guardarropa              | Выбери тип гардероба                    |
| Option 1 | Women's                                                | Femenino                                  | Женский                                 |
| Option 2 | Men's                                                  | Masculino                                 | Мужской                                 |
| Option 3 | Mixed                                                  | Mixto                                     | Смешанный                               |
| Hint     | This determines which garment categories are available | Esto determina las categorías disponibles | Это определяет возможный состав капсулы |

## Guided Journey — Step 2: Category Checklist

| Element               | EN                                                                              | ES-AR                                                                                         | RU                                                                           |
| --------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Title                 | What's in your capsule?                                                         | ¿Qué hay en tu cápsula?                                                                       | Что бы ты хотел включить в свою капсулу?                                     |
| Subtitle              | Select garment types and set quantity                                           | Seleccioná tipos de prendas y definí la cantidad                                              | Выбери типы вещей и укажи количество                                         |
| Add custom CTA        | + Add your own category                                                         | + Agregar tu categoría                                                                        | + Добавить свою категорию                                                    |
| Custom category error | We couldn’t match this category. Choose a similar category or clarify the item. | Esto no parece una prenda básica. Las piezas básicas tienen cortes simples y colores sólidos. | Не удалось определить категорию. Выбери похожую или уточни, что это за вещь. |
| Min warning           | Select at least 8 categories                                                    | Seleccioná al menos 8 categorías                                                              | Выбери минимум 8 категорий                                                   |

## Guided Journey — Step 3: Colors & Items

> The three upload-method labels below are retained reference copy. `Paste links` and search over the
> shared merchant-image corpus must not be exposed as active controls until the PRODUCT-PLAN Q8
> compliance-scheme spec and external legal review are both complete. The own-imagery preset picker
> receives separate active copy with its P2 implementation.

| Element               | EN                                                                   | ES-AR                                                                  | RU                                                            |
| --------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| Title                 | Choose your colors                                                   | Elegí tus colores                                                      | Выбери свои любимые цвета                                     |
| Palette hint          | Choose up to 15 colors. Incompatible ones are blocked automatically. | Elegí hasta 15 colores. Los incompatibles se bloquean automáticamente. | Выбери до 15 цветов. Несовместимые блокируются автоматически. |
| Compatibility warning | This color doesn't combine with the current palette.                 | Este color no combina con la paleta actual.                            | Этот цвет не сочетается с текущей палитрой.                   |
| Items section         | Add your garments                                                    | Agregá tus prendas                                                     | Добавь свои вещи                                              |
| Upload methods        | Upload photos / Paste links / Search catalog                         | Subir fotos / Pegar links / Buscar en catálogo                         | Загрузить фото / Вставить ссылки / Поиск в каталоге           |
| Create CTA            | Create capsule                                                       | Crear cápsula                                                          | Создать капсулу                                               |

## Capsule Result

| Element           | EN                        | ES-AR                      | RU                            |
| ----------------- | ------------------------- | -------------------------- | ----------------------------- |
| Title             | Your capsule is ready     | Tu cápsula está lista      | Твоя капсула готова           |
| Outfits tab       | Outfits                   | Outfits                    | Комплекты                     |
| Gap analysis tab  | What's missing            | Qué te falta               | Чего не хватает               |
| Shopping list tab | Shopping list             | Lista de compras           | Шоппинг-лист                  |
| Empty gap         | Your capsule is complete! | ¡Tu cápsula está completa! | Капсула полная! Пробелов нет. |
| Remove item       | Remove from capsule       | Quitar de la cápsula       | Убрать из капсулы             |
| Replace item      | Replace item              | Reemplazar prenda          | Заменить вещь                 |
| Add item          | Add item                  | Agregar prenda             | Добавить вещь                 |

---

## Navigation (Sidebar — all authenticated screens)

| Element            | EN            | ES-AR            | RU           |
| ------------------ | ------------- | ---------------- | ------------ |
| Overview           | Overview      | Resumen          | Обзор        |
| Dashboard          | Dashboard     | Panel            | Главная      |
| Wardrobe (section) | Wardrobe      | Guardarropa      | Гардероб     |
| My Items           | My Items      | Mis Prendas      | Мои вещи     |
| Outfits            | Outfits       | Combinaciones    | Комплекты    |
| Capsules           | Capsules      | Cápsulas         | Капсулы      |
| Uncapsulated       | Uncapsulated  | Sin Cápsula      | Без капсулы  |
| Lists (section)    | Lists         | Listas           | Списки       |
| Favorites          | Favorites     | Favoritos        | Избранное    |
| Shopping List      | Shopping List | Lista de Compras | Шоппинг-лист |
| For Sale           | For Sale      | En Venta         | На продажу   |
| For Repair         | For Repair    | En Reparación    | На ремонт    |
| Settings           | Settings      | Configuración    | Настройки    |
| Profile            | Profile       | Perfil           | Профиль      |
| More               | More          | Más              | Ещё          |

---

## Landing Page

> Hero-копия утверждена фаундером в спеке 043 (прототип `landing-v2/v1c-final.html`) и реализована
> в живом `/app` спекой 044. RU-тон лендинга — «ты» (решение 2026-07-17); остальной продукт — «вы».
> Прежний манифест «When new money mindset…» отставлен вместе с постерным лендингом.

| Element                              | EN                                                                                          | ES-AR                                                                                                 | RU                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Hero headline (2 строки)             | Create your / capsule wardrobe                                                              | Creá tu / armario cápsula                                                                             | Создай свою / гардеробную капсулу                                                                           |
| Hero subtitle                        | Upload a few photos of the clothes you love — and see what to add for more everyday outfits | Subí unas fotos de tu ropa favorita — y descubrí qué agregar para tener más outfits de todos los días | Загрузи несколько фото любимых вещей — и узнай, что добавить, чтобы образов на каждый день стало больше     |
| Primary CTA (hero, gold)             | Try for free                                                                                | Probá gratis                                                                                          | Попробовать бесплатно                                                                                       |
| Auth CTA (header, ghost)             | Log In                                                                                      | Iniciar sesión                                                                                        | Войти                                                                                                       |
| How it works (stub head)             | How it works — slides will land here                                                        | Cómo funciona — los slides van a aparecer acá                                                         | Как это работает — слайды появятся здесь                                                                    |
| Stub card                            | Reserved: step {n}                                                                          | Reservado: paso {n}                                                                                   | Зарезервировано: шаг {n}                                                                                    |
| Footer: Terms                        | Terms of Use                                                                                | Términos de Uso                                                                                       | Условия использования                                                                                       |
| Footer: Privacy                      | Privacy Policy                                                                              | Política de Privacidad                                                                                | Политика конфиденциальности                                                                                 |
| Footer / legal nav: Community        | Community Guidelines                                                                        | —                                                                                                     | Правила сообщества                                                                                          |
| Footer / legal nav: Copyright policy | Copyright & IP                                                                              | —                                                                                                     | Авторские и иные права                                                                                      |
| Footer / legal nav: Enforcement      | Enforcement & Appeals                                                                       | —                                                                                                     | Модерация и обжалование                                                                                     |
| Current Terms: archived revision     | Read the Terms effective July 24, 2026                                                      | —                                                                                                     | Открыть Условия, действовавшие с 24 июля 2026 г.                                                            |
| Footer: Copyright                    | © 2026 Capsule Zero                                                                         | © 2026 Capsule Zero                                                                                   | © 2026 Capsule Zero                                                                                         |
| Cookie banner                        | We use cookies to improve your experience. By continuing you accept our Cookie Policy.      | Usamos cookies para mejorar tu experiencia. Al continuar, aceptás nuestra Política de Cookies.        | Мы используем куки для улучшения работы сервиса. Продолжая использование, вы принимаете нашу Политику куки. |
| Cookie: Accept                       | Accept                                                                                      | Aceptar                                                                                               | Принять                                                                                                     |
| Cookie: Settings                     | Settings                                                                                    | Configuración                                                                                         | Настройки                                                                                                   |

---

## Auth (Sign In / Sign Up)

| Element                       | EN                                                                                                          | ES-AR                                                                                                         | RU                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Panel title: Sign Up          | Create Account                                                                                              | Crear Cuenta                                                                                                  | Регистрация                                                                                                     |
| Panel title: Log In           | Log In                                                                                                      | Iniciar sesión                                                                                                | Вход                                                                                                            |
| Placeholder: Email            | Email                                                                                                       | Email                                                                                                         | Email                                                                                                           |
| Placeholder: Password         | Password                                                                                                    | Contraseña                                                                                                    | Пароль                                                                                                          |
| Placeholder: Confirm password | Confirm password                                                                                            | Confirmá tu contraseña                                                                                        | Подтвердите пароль                                                                                              |
| Forgot password               | Forgot password?                                                                                            | ¿Olvidaste tu contraseña?                                                                                     | Забыли пароль?                                                                                                  |
| Sign in link                  | New here? Create an account                                                                                 | ¿Primera vez? Creá una cuenta                                                                                 | Впервые здесь? Создать аккаунт                                                                                  |
| Log in link                   | Already have an account? Log in                                                                             | ¿Ya tenés cuenta? Iniciá sesión                                                                               | Уже есть аккаунт? Войдите                                                                                       |
| Create account CTA            | Create Account                                                                                              | Crear Cuenta                                                                                                  | Создать аккаунт                                                                                                 |
| Social divider                | or                                                                                                          | o                                                                                                             | или                                                                                                             |
| Social: Google                | Continue with Google                                                                                        | Continuar con Google                                                                                          | Продолжить с Google                                                                                             |
| Social: Google (redirecting)  | Opening Google…                                                                                             | Abriendo Google…                                                                                              | Открываем Google…                                                                                               |
| Error: Google sign-in         | We couldn't sign you in with Google. Try again — or use your password if this email already has an account. | No pudimos iniciar sesión con Google. Probá de nuevo — o usá tu contraseña si este email ya tiene una cuenta. | Не удалось войти через Google. Попробуйте ещё раз — или войдите по паролю, если у этого email уже есть аккаунт. |
| Social: Apple                 | Continue with Apple                                                                                         | Continuar con Apple                                                                                           | Войти с Apple                                                                                                   |
| Terms consent                 | By continuing you agree to our Terms of Use and Privacy Policy                                              | Al continuar, aceptás nuestros Términos de Uso y Política de Privacidad                                       | Продолжая, вы принимаете Условия использования и Политику конфиденциальности                                    |
| Error: Invalid email          | Please enter a valid email                                                                                  | Ingresá un email válido                                                                                       | Введите корректный email                                                                                        |
| Error: Weak password          | Password must be at least 8 characters                                                                      | La contraseña debe tener al menos 8 caracteres                                                                | Пароль должен содержать минимум 8 символов                                                                      |
| Error: Passwords don't match  | Passwords don't match                                                                                       | Las contraseñas no coinciden                                                                                  | Пароли не совпадают                                                                                             |

---

## Dashboard

| Element                       | EN                                                                    | ES-AR                                                                        | RU                                                                           |
| ----------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Welcome                       | Welcome!                                                              | ¡Bienvenida!                                                                 | Добро пожаловать!                                                            |
| OPR label                     | OPR                                                                   | OPR                                                                          | OPR                                                                          |
| OPR tooltip                   | Wearable outfits per core or accessory item; layers scored separately | Outfits utilizables por prenda base o accesorio; las capas se evalúan aparte | Носибельные комплекты на вещи основы и аксессуары; слои оцениваются отдельно |
| Layering Coverage             | Layering Coverage                                                     | Cobertura de capas                                                           | Покрытие слоями                                                              |
| Layering Coverage unavailable | N/A — add a base look first                                           | N/D — primero agregá un look base                                            | Н/Д — сначала добавьте базовый образ                                         |
| Layering diagnostics          | Mid {covered}/{total} · Outer {covered}/{total}                       | Media capa {covered}/{total} · Exterior {covered}/{total}                    | Средний слой {covered}/{total} · Верхний слой {covered}/{total}              |
| Total Items                   | Total Items                                                           | Total de Prendas                                                             | Всего вещей                                                                  |
| in wardrobe                   | in wardrobe                                                           | en guardarropa                                                               | в гардеробе                                                                  |
| Total Outfits                 | Total Outfits                                                         | Total de Outfits                                                             | Всего комплектов                                                             |
| across all capsules           | across all capsules                                                   | en todas las cápsulas                                                        | во всех капсулах                                                             |
| Color Palette                 | Color Palette                                                         | Paleta de Colores                                                            | Цветовая палитра                                                             |
| Items (count label)           | Items                                                                 | Prendas                                                                      | Вещей                                                                        |
| Categories (count label)      | Categories                                                            | Categorías                                                                   | Категорий                                                                    |
| Open Capsule                  | Open Capsule                                                          | Abrir Cápsula                                                                | Открыть капсулу                                                              |
| Uncapsulated CTA              | collect into a capsule                                                | agrupar en una cápsula                                                       | собрать в капсулу                                                            |
| Recently Added                | Recently Added                                                        | Agregadas recientemente                                                      | Недавно добавлено                                                            |
| All Items link                | All Items →                                                           | Todas las Prendas →                                                          | Все вещи →                                                                   |
| All link (generic)            | All →                                                                 | Todo →                                                                       | Все →                                                                        |
| Empty state: no capsule       | No capsule yet. Start your first capsule.                             | Sin cápsula aún. Comenzá tu primera cápsula.                                 | Капсулы пока нет. Начни свою первую капсулу.                                 |
| Empty state: no items         | Your wardrobe is empty.                                               | Tu guardarropa está vacío.                                                   | Гардероб пуст.                                                               |

---

## My Items

| Element                | EN                                           | ES-AR                                                | RU                                 |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| Screen title           | My Items                                     | Mis Prendas                                          | Мои вещи                           |
| Item count             | {N} items in wardrobe                        | {N} prendas en guardarropa                           | {N} вещей в гардеробе              |
| Sort label             | Sort: Name                                   | Ordenar: Nombre                                      | Сорт.: Название                    |
| Filter: All            | All                                          | Todo                                                 | Все                                |
| Filter: Tops           | Tops                                         | Tops                                                 | Верх                               |
| Filter: Bottoms        | Bottoms                                      | Pantalones/Faldas                                    | Низ                                |
| Filter: Dresses        | Dresses & Skirts                             | Vestidos y Faldas                                    | Платья и юбки                      |
| Filter: Outerwear      | Outerwear                                    | Abrigos                                              | Верхняя одежда                     |
| Filter: Shoes          | Shoes                                        | Calzado                                              | Обувь                              |
| Filter: Bags           | Bags                                         | Bolsos                                               | Сумки                              |
| Filter: Accessories    | Accessories                                  | Accesorios                                           | Аксессуары                         |
| Action: Edit           | Edit Item                                    | Editar prenda                                        | Редактировать                      |
| Action: Favorite       | Add to favorites                             | Agregar a favoritos                                  | В избранное                        |
| Action: For Sale       | Move to For Sale                             | Mover a En Venta                                     | На продажу                         |
| Action: For Repair     | Move to For Repair                           | Mover a En Reparación                                | На ремонт                          |
| Action: Delete         | Delete                                       | Eliminar                                             | Удалить                            |
| Action: Add to capsule | Add to capsule                               | Agregar a cápsula                                    | Добавить в капсулу                 |
| Field: Name            | Name                                         | Nombre                                               | Название                           |
| Field: Category        | Category                                     | Categoría                                            | Категория                          |
| Field: Color           | Color                                        | Color                                                | Цвет                               |
| Field: Brand           | Brand                                        | Marca                                                | Бренд                              |
| Field: Material        | Material / Composition                       | Material / Composición                               | Состав                             |
| Field: Price           | Price                                        | Precio                                               | Цена                               |
| Field: Source URL      | Source URL                                   | URL de origen                                        | Ссылка                             |
| Add item CTA           | + Add Item                                   | + Agregar Prenda                                     | + Добавить вещь                    |
| Empty state            | Your wardrobe is empty. Add your first item. | Tu guardarropa está vacío. Agregá tu primera prenda. | Гардероб пуст. Добавь первую вещь. |

---

## Uncapsulated

| Element                | EN                         | ES-AR                                | RU                                 |
| ---------------------- | -------------------------- | ------------------------------------ | ---------------------------------- |
| Screen title           | Uncapsulated               | Sin Cápsula                          | Без капсулы                        |
| Item count             | {N} items without capsule  | {N} prendas sin cápsula              | {N} вещей без капсулы              |
| Action: Add to capsule | Add to Capsule             | Agregar a Cápsula                    | Добавить в капсулу                 |
| Action: For Sale       | Move to For Sale           | Mover a En Venta                     | На продажу                         |
| Action: For Repair     | Move to For Repair         | Mover a En Reparación                | На ремонт                          |
| Empty state            | All items are in capsules. | Todas las prendas están en cápsulas. | Все вещи распределены по капсулам. |

---

## Favorites

| Element                    | EN                                   | ES-AR                                          | RU                                          |
| -------------------------- | ------------------------------------ | ---------------------------------------------- | ------------------------------------------- |
| Screen title               | Favorites                            | Favoritos                                      | Избранное                                   |
| Tab: My                    | My                                   | Mis favoritos                                  | Мои                                         |
| Tab: From Catalog          | From Catalog                         | Del Catálogo                                   | Из каталога                                 |
| Item count                 | {N} items saved                      | {N} prendas guardadas                          | {N} вещей сохранено                         |
| Empty state (My)           | No favorites yet. Tap ♥ on any item. | Sin favoritos aún. Tocá ♥ en cualquier prenda. | Пока нет избранного. Нажми ♥ на любую вещь. |
| Empty state (From Catalog) | No catalog items saved yet.          | Sin prendas del catálogo guardadas aún.        | Нет сохранённых вещей из каталогов.         |

---

## For Sale

| Element        | EN                    | ES-AR                    | RU                    |
| -------------- | --------------------- | ------------------------ | --------------------- |
| Screen title   | For Sale              | En Venta                 | На продажу            |
| Item count     | {N} items listed      | {N} prendas listadas     | {N} вещей выставлено  |
| Action: Edit   | Edit Item             | Editar prenda            | Редактировать         |
| Action: Return | Return to Wardrobe    | Devolver al Guardarropa  | Вернуть в гардероб    |
| Empty state    | Nothing for sale yet. | Nada en venta por ahora. | Нет вещей на продажу. |

---

## For Repair

| Element                | EN                              | ES-AR                               | RU                         |
| ---------------------- | ------------------------------- | ----------------------------------- | -------------------------- |
| Screen title           | For Repair                      | En Reparación                       | На ремонт                  |
| Item count (1)         | 1 item needs attention          | 1 prenda necesita atención          | 1 вещь требует внимания    |
| Item count (N)         | {N} items need attention        | {N} prendas necesitan atención      | {N} вещей требуют внимания |
| Action: Repair details | Repair Details                  | Detalles de Reparación              | Детали ремонта             |
| Action: Return         | Return to Wardrobe              | Devolver al Guardarropa             | Вернуть в гардероб         |
| Action: Uncapsulate    | Move to Uncapsulated            | Mover a Sin Cápsula                 | В «Без капсулы»            |
| Empty state            | Nothing needs repair right now. | Nada necesita reparación por ahora. | Вещей на ремонте нет.      |

---

## Profile & Settings

| Element          | EN                  | ES-AR                | RU                  |
| ---------------- | ------------------- | -------------------- | ------------------- |
| Screen title     | Profile             | Perfil               | Профиль             |
| Subtitle         | Manage your profile | Administrá tu perfil | Управление профилем |
| Field: Full Name | Full Name           | Nombre completo      | Полное имя          |
| Field: Email     | Email               | Email                | Email               |
| Field: Country   | Country             | País                 | Страна              |
| Field: City      | City                | Ciudad               | Город               |
| Language label   | Language            | Idioma               | Язык                |
| Save CTA         | Save Changes        | Guardar cambios      | Сохранить изменения |
| Log out          | Log Out             | Cerrar sesión        | Выйти               |

## Validation additions — spec 053

| Key                                  | EN                                                                                                                  | RU                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| auth.passwordRequirements            | Use at least 8 characters. Symbols, including \_, are allowed. Choose a password that is different from your email. | Минимум 8 символов. Можно использовать любые символы, включая \_. Пароль не должен быть похож на ваш email. |
| auth.errors.PASSWORD_TOO_SIMILAR     | Choose a password that is different from your email address.                                                        | Пароль слишком похож на ваш email. Придумайте другой пароль.                                                |
| auth.errors.PASSWORD_TOO_SHORT       | Password must be at least 8 characters.                                                                             | Пароль должен содержать минимум 8 символов.                                                                 |
| auth.errors.PASSWORD_TOO_LONG        | Choose a shorter password.                                                                                          | Выберите более короткий пароль.                                                                             |
| auth.errors.PASSWORD_COMPROMISED     | This password has appeared in a data breach. Choose another password.                                               | Этот пароль найден в утечках данных. Придумайте другой пароль.                                              |
| auth.errors.PASSWORD_UNCHANGED       | Choose a password different from your current password.                                                             | Новый пароль должен отличаться от текущего.                                                                 |
| auth.errors.PASSWORD_POLICY_REJECTED | This password does not meet the security requirements. Choose another password.                                     | Этот пароль не соответствует требованиям безопасности. Придумайте другой пароль.                            |
| auth.errors.INVALID_EMAIL            | Please enter a valid email.                                                                                         | Введите корректный email.                                                                                   |
| auth.errors.PASSWORDS_MISMATCH       | Passwords don't match.                                                                                              | Пароли не совпадают.                                                                                        |
| profile.validation.usernameLength    | Username must be 3–30 characters.                                                                                   | Никнейм должен содержать от 3 до 30 символов.                                                               |

Personal-name min(1) and existing required-name messages remain unchanged; EN/RU are the only active locales. Unknown auth codes continue to use the generic localized message.

### Profile sessions (specs 056/057/058)

| Key                                 | EN                                         | RU                                  |
| ----------------------------------- | ------------------------------------------ | ----------------------------------- |
| profile.account.sessionsUnavailable | Session details are currently unavailable. | Сведения о сессиях пока недоступны. |

| profile.account.sessionsEmpty | No active sessions found. | Активных сессий нет. |
| profile.account.session | Session | Сессия |
| profile.account.current | Current | Текущая |
| profile.account.signedIn | Signed in: | Вход: |
| profile.account.expires | Expires: | Действует до: |

| profile.account.endSession | End session | Завершить сессию |
| profile.account.endOthers | End all other sessions | Завершить все остальные сессии |
| profile.account.ending | Ending… | Завершаем… |
| profile.account.ended | Sessions ended. This session is still active. | Сессии завершены. Текущая сессия остаётся активной. |
| profile.account.endFailed | Could not end sessions. Try again. | Не удалось завершить сессии. Попробуйте ещё раз. |
| profile.account.signInAgain | Your session has expired. Sign in again. | Сессия истекла. Войдите снова. |

Actual Kratos inventory replaces sample devices/activity. The current marker matches the authenticated session ID. Authentication and expiry dates are localized and explicitly labelled UTC. The unavailable copy remains for upstream failures and unsupported providers; it differs from successfully loaded empty inventory.

## Guest account save (spec 056)

Active EN/RU copy is in `app/src/messages/{en,ru}.json`, namespace `guest`: saving/wait, preserved selection, save failure/retry, owner mismatch/no intent, saved confirmation and account/dashboard links. The save continuation announces busy/error states and disables the initiating CTA while busy. No price, payment or new registration pitch is added after authentication. ES-AR remains deferred.

## MVP cut guidance — target EN/RU copy (2026-10-21)

Required by PRODUCT-PLAN D4/Q5; implement with the existing EN/RU message catalog and shared UI
in the application PR. These are target strings, not already shipped UI. Numeric basicity stays
internal. Spanish remains reference-only. Unknown does not imply an item is dated or bad.

| Situation           | EN                                                                                                         | RU                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Missing tags/review | We need to check this cut. Confirm the details or choose a reviewed alternative.                           | Этот крой ещё нужно проверить. Уточни детали вещи или выбери проверенную замену.                                     |
| Whole-look conflict | This knit is too bulky for this fitted blazer. Try a roomier layer.                                        | Этот свитер слишком объёмный для приталенного пиджака. Попробуй более свободный слой.                                |
| Currentness review  | This cut is outside our current selection. Keep the item; choose an alternative for verified outfits.      | Этот крой не входит в актуальную подборку. Вещь можно оставить; для проверенных образов выбери замену.               |
| Saved old result    | This result uses an earlier algorithm. Recalculate to check cuts; your saved result will remain available. | Этот результат рассчитан прежним алгоритмом. Пересчитай его с учётом кроя; сохранённый результат останется доступен. |
| No verified look    | No verified outfit yet. Review the highlighted details or try a suggested replacement.                     | Пока нет проверенного образа. Уточни отмеченные детали или попробуй предложенную замену.                             |

Canonical meanings and review rules: `project/methodology/capsule-methodology.md` §6.1 and
`project/methodology/outfit-generation.md` §2.5. Guidance must use the actual failed rule, never a
blanket judgement about the user's taste, designer brands or price.
