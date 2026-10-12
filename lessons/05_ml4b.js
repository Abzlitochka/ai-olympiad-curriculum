/* Beginner layer for M1 — two lessons adapted from Microsoft «ML for Beginners»
   (MIT, https://github.com/microsoft/ML-For-Beginners): 1-Introduction/1-intro-to-ML
   and 1-Introduction/4-techniques-of-ML. English is the original text, trimmed of
   course logistics (setup videos, GitHub, Node.js); Russian is the repository's
   translation edited by hand. Licence text: THIRD_PARTY.md. Both lessons are
   prepended to M1 so the module opens with the no-prerequisites layer. */

const ML4B = "https://github.com/microsoft/ML-For-Beginners/tree/main/";
const ML4B_CREDIT = (lesson, path) => note(B(
  `Adapted from Microsoft **ML for Beginners** (MIT licence), lesson “${lesson}” — [original](${ML4B}${path}). The Russian text is the project's translation, edited by hand.`,
  `Адаптировано из курса Microsoft **ML for Beginners** (лицензия MIT), урок «${lesson}» — [оригинал](${ML4B}${path}). Русский текст — отредактированный перевод проекта.`));

if (COURSE.M1) COURSE.M1.unshift(

L(B("What is machine learning?", "Что такое машинное обучение"), 20,
  [["ML for Beginners: Introduction to ML", ML4B + "1-Introduction/1-intro-to-ML"], REF.skl], [

  T(B("A machine that learns from examples", "Машина, которая учится на примерах"), [
    ML4B_CREDIT("Introduction to machine learning", "1-Introduction/1-intro-to-ML"),
    p(B("The term “machine learning” is one of the most popular terms of today. You have almost certainly heard it, whatever you do. The mechanics behind it, however, are a mystery to most people, and for a beginner the subject can feel overwhelming. So it matters to understand what machine learning actually is, and to learn it step by step, through practical examples.",
        "«Машинное обучение» — одно из самых популярных словосочетаний нашего времени. Вы почти наверняка его слышали, чем бы ни занимались. Но как оно устроено внутри, для большинства людей загадка, а новичку тема может казаться неподъёмной. Поэтому важно понять, что такое машинное обучение на самом деле, и разбираться в нём шаг за шагом, на практических примерах.")),
    p(B("A child's brain and senses perceive the facts of their surroundings and gradually learn the hidden patterns of life. Those patterns help the child craft rules for recognising what they have already seen. The human brain perceives the real world, processes what it perceives, makes decisions and acts — that is what we call behaving intelligently. When we program an imitation of this process into a machine, we call it **artificial intelligence (AI)**.",
        "Мозг ребёнка и его органы чувств воспринимают факты окружающего мира и постепенно улавливают скрытые закономерности. Эти закономерности помогают ребёнку строить правила: узнавать то, что он уже видел. Человеческий мозг воспринимает мир, обрабатывает информацию, принимает решения и действует — это мы и называем разумным поведением. Когда мы программируем подобие этого процесса в машине, это называют **искусственным интеллектом (ИИ)**.")),
    p(B("Machine learning (ML) is an important subset of AI. **ML uses specialised algorithms to uncover meaningful information and find hidden patterns in data, so that decisions can be made on evidence rather than on hand-written rules.**",
        "Машинное обучение (ML) — важная часть ИИ. **ML использует специальные алгоритмы, чтобы находить в данных значимую информацию и скрытые закономерности, и принимать решения на основе данных, а не правил, написанных вручную.**")),
  ]),

  T(B("AI, ML, deep learning and data science", "ИИ, ML, глубокое обучение и наука о данных"), [
    img("img/ml4b/ai-ml-ds.webp",
        B("Nested circles: AI contains ML, ML contains deep learning; data science overlaps all of them", "Вложенные круги: ИИ содержит ML, ML содержит глубокое обучение; наука о данных пересекается со всеми"),
        B("How AI, ML, deep learning and data science relate. Infographic by [Jen Looper](https://twitter.com/jenlooper).", "Как связаны ИИ, ML, глубокое обучение и наука о данных. Инфографика [Jen Looper](https://twitter.com/jenlooper).")),
    p(B("The terms are easy to confuse, so keep the picture in mind. **Artificial intelligence** is the broad goal: machines that behave intelligently. **Machine learning** is the part of AI where the behaviour is learned from data instead of being programmed by hand. **Deep learning** is the part of ML that uses many-layered neural networks. **Data science** is the craft of getting insight from data; it uses ML, but also statistics, visualisation and plain curiosity.",
        "Термины легко перепутать, поэтому держите картинку в голове. **Искусственный интеллект** — общая цель: машины, которые ведут себя разумно. **Машинное обучение** — та часть ИИ, где поведение не программируют вручную, а выучивают из данных. **Глубокое обучение** — часть ML, где используют многослойные нейросети. **Наука о данных** — умение извлекать смысл из данных; она пользуется ML, но ещё статистикой, визуализацией и обычным любопытством.")),
    p(B("In this module we cover **classical machine learning**: the core ideas every beginner must know, mostly with the Scikit-learn library. Neural networks and deep learning come later (module M16) — they rest on exactly these foundations.",
        "В этом модуле мы разбираем **классическое машинное обучение**: основные идеи, которые должен знать каждый новичок, в основном с библиотекой Scikit-learn. Нейросети и глубокое обучение будут позже (модуль M16) — они стоят ровно на этом фундаменте.")),
    ul([
      B("regression — predicting a number (a price, a temperature)", "регрессия — предсказать число (цену, температуру)"),
      B("classification — predicting a category (spam or not, which cuisine a recipe belongs to)", "классификация — предсказать категорию (спам или нет, к какой кухне относится рецепт)"),
      B("clustering — finding groups in data nobody has labelled", "кластеризация — найти группы в данных, которые никто не размечал"),
    ]),
  ]),

  Q(B("How are artificial intelligence and machine learning related?", "Как связаны искусственный интеллект и машинное обучение?"), [
      B("Machine learning is a subset of AI: the part where behaviour is learned from data", "Машинное обучение — часть ИИ: та, где поведение выучивают из данных"),
      B("They are two names for the same thing", "Это два названия одного и того же"),
      B("AI is a subset of machine learning", "ИИ — часть машинного обучения"),
    ], 0,
    B("AI is the broad goal; ML is one way to reach it — by learning patterns from data. Deep learning is, in turn, a subset of ML.",
      "ИИ — общая цель, а ML — один из способов её достичь: выучить закономерности из данных. Глубокое обучение, в свою очередь, часть ML.")),

  T(B("Rules versus learning: why bother?", "Правила против обучения: зачем это нужно"), [
    p(B("From a systems point of view, machine learning means building automated systems that learn hidden patterns from data to help make intelligent decisions. The motivation is loosely inspired by how the brain learns from what it perceives.",
        "С точки зрения систем машинное обучение — это создание автоматических систем, которые выучивают скрытые закономерности в данных и помогают принимать разумные решения. Идея отдалённо вдохновлена тем, как мозг учится на том, что воспринимает.")),
    p(B("Think for a minute: why would a business try machine learning instead of writing a hard-coded rules engine? Hint: imagine writing by hand every rule that tells spam from a normal e-mail — and keeping those rules up to date.",
        "Подумайте минуту: зачем бизнесу пробовать машинное обучение, а не писать жёсткие правила вручную? Подсказка: представьте, что вам нужно руками написать все правила, отличающие спам от обычного письма, и потом поддерживать их актуальными.")),
    p(B("**Data quality matters.** High-quality data improves a model; poor or noisy data leads to inaccurate predictions even with the most advanced algorithm. Most of the real work in ML is work on data.",
        "**Качество данных решает.** Хорошие данные улучшают модель; плохие или шумные приводят к неточным прогнозам даже с самым продвинутым алгоритмом. Большая часть настоящей работы в ML — это работа с данными.")),
    img("img/ml4b/hype.webp",
        B("Google Trends line for the query “machine learning”, rising steeply after 2015", "График Google Trends по запросу «machine learning» с резким ростом после 2015 года"),
        B("Google Trends shows the recent “hype curve” of the term “machine learning”.", "Google Trends показывает «кривую ажиотажа» вокруг термина «machine learning».")),
  ]),

  T(B("Where it is used", "Где это применяют"), [
    p(B("Applications of machine learning are now almost everywhere — as ubiquitous as the data flowing from our phones, connected devices and other systems. A few examples:",
        "Машинное обучение сегодня почти везде — его столько же, сколько данных, которые текут с наших телефонов, умных устройств и других систем. Несколько примеров:")),
    ul([
      B("predicting the likelihood of a disease from a patient's medical history", "оценить вероятность болезни по истории пациента"),
      B("using weather data to predict weather events", "предсказывать погодные события по метеоданным"),
      B("understanding the sentiment of a text", "определять настроение текста"),
      B("detecting fake news to stop the spread of propaganda", "выявлять фейковые новости, чтобы остановить пропаганду"),
    ]),
    p(B("Finance, economics, earth science, space exploration, biomedical engineering, cognitive science and even the humanities have adopted machine learning for their heaviest data-processing problems. In the near future a basic understanding of ML will be a must in almost any field.",
        "Финансы, экономика, науки о Земле, космос, биомедицина, когнитивные науки и даже гуманитарные дисциплины используют машинное обучение для самых тяжёлых задач обработки данных. В ближайшем будущем базовое понимание ML понадобится почти в любой области.")),
  ]),

  Q(B("Why does data quality matter so much?", "Почему качество данных так важно?"), [
      B("Bad or noisy data gives inaccurate predictions even with the best algorithm", "Плохие или шумные данные дают неточные прогнозы даже с лучшим алгоритмом"),
      B("It doesn't: a strong algorithm corrects any data", "Не важно: сильный алгоритм исправит любые данные"),
      B("Only the amount of data matters, not its quality", "Важно только количество данных, а не качество"),
    ], 0,
    B("A model learns whatever patterns the data contains — including its errors and noise. Garbage in, garbage out.",
      "Модель выучивает те закономерности, которые есть в данных, включая их ошибки и шум. Мусор на входе — мусор на выходе.")),

  T(B("Challenge", "Задание"), [
    p(B("Sketch, on paper or in an online tool such as [Excalidraw](https://excalidraw.com/), your understanding of the differences between AI, ML, deep learning and data science. Add ideas of problems each of them is good at solving.",
        "Нарисуйте на бумаге или в онлайн-инструменте, например [Excalidraw](https://excalidraw.com/), как вы понимаете разницу между ИИ, ML, глубоким обучением и наукой о данных. Добавьте идеи задач, которые хорошо решает каждый из подходов.")),
    note(B("Next lesson: the seven steps every ML project goes through — from the question to the prediction.",
           "В следующем уроке — семь шагов, через которые проходит любой ML-проект: от вопроса до прогноза.")),
  ]),
]),

L(B("How a model is built: from question to prediction", "Как строят модель: от вопроса до прогноза"), 30,
  [["ML for Beginners: Techniques of ML", ML4B + "1-Introduction/4-techniques-of-ML"], REF.skl], [

  T(B("Seven steps", "Семь шагов"), [
    ML4B_CREDIT("Techniques of machine learning", "1-Introduction/4-techniques-of-ML"),
    p(B("Building, using and maintaining machine learning models is very different from most other development work. At a high level the craft consists of a few steps:",
        "Создание, использование и поддержка моделей машинного обучения заметно отличаются от обычной разработки. На верхнем уровне процесс состоит из нескольких шагов:")),
    ul([
      B("**Decide on the question.** Most ML work starts with a question that a simple rules-based program cannot answer — usually a prediction based on data.", "**Определить вопрос.** Почти всё в ML начинается с вопроса, на который простая программа с правилами ответить не может, — обычно это прогноз на основе данных."),
      B("**Collect and prepare data.** Quality and, sometimes, quantity of data decide how well you can answer. Visualising the data belongs here, and so does splitting it into training and test parts.", "**Собрать и подготовить данные.** Качество, а иногда и количество данных определяют, насколько хорошо вы ответите. Сюда же входят визуализация и разбиение на обучающую и тестовую части."),
      B("**Choose a training method.** It depends on the question and on the nature of the data; this is where expertise and experimentation live.", "**Выбрать метод обучения.** Он зависит от вопроса и от характера данных; здесь нужны опыт и эксперименты."),
      B("**Train the model.** Algorithms adjust the model's internal weights so that it recognises patterns in the training data.", "**Обучить модель.** Алгоритм подстраивает внутренние веса модели так, чтобы она распознавала закономерности в обучающих данных."),
      B("**Evaluate the model** on data it has never seen (the test set).", "**Оценить модель** на данных, которых она не видела (тестовая выборка)."),
      B("**Tune parameters** and repeat if the quality is not good enough.", "**Настроить параметры** и повторить, если качество недостаточное."),
      B("**Predict** on new inputs.", "**Сделать прогноз** на новых данных."),
    ]),
  ]),

  T(B("What question to ask", "Какой вопрос задавать"), [
    p(B("Computers are particularly good at discovering hidden patterns in data. This helps researchers whose questions cannot be answered by a hand-written rules engine. For an actuarial task a data scientist might still handcraft rules about the mortality of smokers versus non-smokers.",
        "Компьютеры особенно хорошо находят скрытые закономерности в данных. Это выручает исследователей, чьи вопросы не решаются набором правил, написанных вручную. Для страховой задачи специалист ещё может руками составить правила о смертности курящих и некурящих.")),
    p(B("When many more variables enter the picture, a model learned from past health records predicts future mortality better than any hand-made rules. A more cheerful example: forecasting April weather at a given place from latitude, longitude, climate trends, distance to the ocean, jet-stream patterns and more.",
        "Но когда переменных становится много, модель, обученная на истории здоровья, предсказывает лучше любых ручных правил. Пример повеселее: прогноз погоды на апрель в конкретном месте по широте, долготе, климатическим трендам, близости океана, струйным течениям и прочему.")),
  ]),

  T(B("Data, features and the target", "Данные, признаки и целевая переменная"), [
    p(B("To answer the question with any certainty you need enough data of the right kind. **Collect** it with care: know where it comes from and what biases it may carry. **Prepare** it: merge sources, normalise, turn strings into numbers, clean, and shuffle if the training method needs that.",
        "Чтобы ответить на вопрос хоть с какой-то уверенностью, нужно достаточно данных нужного типа. **Собирайте** внимательно: понимайте, откуда данные и какие перекосы в них могут быть. **Готовьте**: объединяйте источники, нормализуйте, превращайте строки в числа, чистите и перемешивайте, если метод обучения этого требует.")),
    p(B("A **feature** is a measurable property of the data — in a table, a column such as “date”, “size” or “colour”. In code the features are usually called `X`: the input the model learns from.",
        "**Признак** — измеримое свойство данных; в таблице это столбец: «дата», «размер», «цвет». В коде признаки обычно обозначают `X` — это вход, на котором модель учится.")),
    p(B("The **target** is what you want to predict, usually called `y` — the answer to the question you are asking the data: in December, which **colour** of pumpkin will be cheapest? In San Francisco, which neighbourhoods will have the highest house **price**? The target is sometimes called the label.",
        "**Целевая переменная** — то, что вы хотите предсказать, обычно `y`: ответ на вопрос, который вы задаёте данным. В декабре тыквы какого **цвета** будут самыми дешёвыми? В Сан-Франциско в каких районах самая высокая **цена** жилья? Целевую переменную иногда называют меткой.")),
    note(B("**Feature selection vs feature extraction.** Selection returns a subset of the existing columns; extraction builds new features from functions of the old ones. Both aim at the best-performing model with the right variables.",
           "**Отбор признаков и извлечение признаков** — не одно и то же. Отбор оставляет подмножество существующих столбцов; извлечение строит новые признаки из функций старых. Цель общая: самая сильная модель на правильных переменных.")),
  ]),

  Q(B("In a table of pumpkins we want to predict the price. The “price” column is…", "В таблице с тыквами мы хотим предсказать цену. Столбец «цена» — это…"), [
      B("the target `y` — the thing we predict", "целевая переменная `y` — то, что мы предсказываем"),
      B("a feature `X`, like every other column", "признак `X`, как и любой другой столбец"),
      B("neither — prices cannot be used in ML", "ни то ни другое — цены в ML не используют"),
    ], 0,
    B("Whatever we predict is the target; the remaining columns are candidate features. The same column can play either role depending on the question.",
      "То, что предсказываем, — целевая переменная; остальные столбцы — кандидаты в признаки. Один и тот же столбец может играть любую роль в зависимости от вопроса.")),

  T(B("Visualise, then split", "Визуализируйте, потом разделите"), [
    p(B("An important tool in the data scientist's kit is visualisation with libraries such as Matplotlib or Seaborn. A picture of the data often reveals hidden correlations you can exploit — and bias or imbalance you must deal with.",
        "Важный инструмент специалиста по данным — визуализация библиотеками вроде Matplotlib или Seaborn. Картинка часто показывает скрытые корреляции, которые можно использовать, и перекосы или дисбаланс, с которыми придётся разбираться.")),
    p(B("Before training, split the dataset into parts of unequal size that still represent the data well:",
        "Перед обучением разделите набор данных на части разного размера, каждая из которых всё ещё хорошо представляет данные:")),
    ul([
      B("**Training set** — the model is fit to it; usually the majority of the data.", "**Обучающая выборка** — на ней модель подгоняют; обычно это большая часть данных."),
      B("**Test set** — an independent part used to confirm how the built model performs.", "**Тестовая выборка** — независимая часть, на которой проверяют, как построенная модель работает."),
      B("**Validation set** — a smaller independent part for tuning hyperparameters or architecture. With little data you may skip it.", "**Валидационная выборка** — часть поменьше, для настройки гиперпараметров или архитектуры. При малом объёме данных её можно не выделять."),
    ]),
  ]),

  Q(B("Why keep a test set the model never trains on?", "Зачем откладывать тестовую выборку, на которой модель не обучается?"), [
      B("To measure how the model behaves on data it has not seen", "Чтобы измерить, как модель ведёт себя на данных, которых не видела"),
      B("To make training faster", "Чтобы обучение шло быстрее"),
      B("To get more data for training", "Чтобы получить больше данных для обучения"),
    ], 0,
    B("Scoring a model on the data it memorised proves nothing. Only unseen data shows whether it learned a pattern or just the examples.",
      "Оценка на тех же данных, которые модель запомнила, ничего не доказывает. Только невиданные данные показывают, выучила ли она закономерность или просто примеры.")),

  T(B("Train, evaluate — and watch for overfitting", "Обучить, оценить и не переобучиться"), [
    p(B("Using the training data you build a **model** — a statistical representation of the data — by **training** it with an algorithm. The method depends on the question and the data; Scikit-learn's documentation lists many, and you will usually try several.",
        "На обучающих данных вы строите **модель** — статистическое представление данных — **обучая** её алгоритмом. Метод зависит от вопроса и данных; в документации Scikit-learn их много, и обычно вы пробуете несколько.")),
    p(B("In most ML libraries training is one line, `model.fit(X, y)`: you pass the features `X` and the target `y`. Once training is done (for a large model it may take many passes, or *epochs*), evaluate the model on the test data — the part it has never analysed — and print its quality metrics.",
        "В большинстве библиотек обучение — одна строка, `model.fit(X, y)`: вы передаёте признаки `X` и целевую переменную `y`. Когда обучение закончено (для большой модели это много проходов, или *эпох*), оцените модель на тестовых данных — той части, которую она не видела, — и выведите метрики качества.")),
    img("img/ml4b/overfitting.webp",
        B("Three plots: underfitting (line misses the trend), good fit, overfitting (curve chases every point)", "Три графика: недообучение (линия не ловит тренд), хорошая подгонка, переобучение (кривая гонится за каждой точкой)"),
        B("Underfitting, a good fit, overfitting. Infographic by [Jen Looper](https://twitter.com/jenlooper).", "Недообучение, хорошая подгонка, переобучение. Инфографика [Jen Looper](https://twitter.com/jenlooper).")),
    p(B("**Model fitting** is how accurately the model's underlying function describes data it is not familiar with. **Underfitting** and **overfitting** are the two classic failures: an underfit model is too crude to describe even the training data; an overfit model learned the training data's details and noise so well that it fails on anything new.",
        "**Подгонка модели** — насколько точно функция внутри модели описывает незнакомые данные. **Недообучение** и **переобучение** — два классических провала: недообученная модель слишком груба даже для обучающих данных; переобученная выучила их детали и шум так хорошо, что проваливается на всём новом.")),
  ]),

  Q(B("A model scores perfectly on the training data but badly on new data. This is…", "Модель идеально отвечает на обучающих данных, но плохо на новых. Это…"), [
      B("overfitting — it memorised details and noise", "переобучение — она запомнила детали и шум"),
      B("underfitting — it is too simple", "недообучение — она слишком простая"),
      B("normal: every model works only on its training data", "норма: любая модель работает только на обучающих данных"),
    ], 0,
    B("Perfect training score plus poor test score is the signature of overfitting. The fix is more data, a simpler model or regularisation — all later in this module.",
      "Идеальный результат на обучении и плохой на тесте — подпись переобучения. Лечение: больше данных, более простая модель или регуляризация — всё это дальше в модуле.")),

  T(B("Tune, then predict", "Настроить и предсказать"), [
    p(B("After the first training, look at the quality and improve it by tweaking **hyperparameters** — the settings that control how the algorithm learns (how deep a tree, how strong a penalty).",
        "После первого обучения посмотрите на качество и улучшайте его, подкручивая **гиперпараметры** — настройки, которые управляют тем, как алгоритм учится (глубина дерева, сила штрафа).")),
    p(B("Finally comes **prediction**: completely new data goes into the model and its answer comes out — in an app this is usually called inference. In a contest this step is your submission file; in a product it is what the user sees after pressing a button.",
        "И наконец **прогноз**: в модель подают совершенно новые данные и получают ответ — в приложениях это называют инференсом. На олимпиаде этот шаг — ваш файл с ответами; в продукте — то, что пользователь видит после нажатия кнопки.")),
  ]),

  T(B("Challenge", "Задание"), [
    p(B("Draw a flow chart of the steps of an ML practitioner. Where are you in the process right now? Where do you expect difficulty, and what seems easy?",
        "Нарисуйте блок-схему шагов ML-специалиста. Где в этом процессе вы сейчас? Где ждёте трудностей, а что кажется простым?")),
    p(B("Review: search for interviews with data scientists about their daily work — for example [this one](https://www.youtube.com/watch?v=Z3IjgbbCEfs). Notice how much of the day is spent on data rather than on models.",
        "Для закрепления найдите интервью специалистов по данным об их обычном рабочем дне — например, [это](https://www.youtube.com/watch?v=Z3IjgbbCEfs). Обратите внимание, сколько времени уходит на данные, а не на модели.")),
  ]),
])

);
