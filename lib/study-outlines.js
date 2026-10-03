// Seed data for study plans: a sample outline for every unit, the curated
// resources a plan may link to, and tips from seeded students and mentors.
//
// The outlines are SAMPLES written for the demo, not Deakin's official task
// lists: the plan page says so and points students to their unit site.
// Every resource URL was opened on 2026-10-03 (links that block automated
// checks were left out). A plan can only link to these, or to links that
// students shared in the unit's posts, so the AI can't invent URLs.

export const RESOURCES = {
  splashkit: { title: "SplashKit guides", url: "https://splashkit.io/guides/", kind: "docs" },
  cs50: { title: "CS50x course (Harvard, free)", url: "https://cs50.harvard.edu/x/", kind: "course" },
  cs50yt: { title: "CS50 on YouTube", url: "https://www.youtube.com/@cs50", kind: "video" },
  fcc: { title: "freeCodeCamp curriculum", url: "https://www.freecodecamp.org/learn/", kind: "practice" },
  fccyt: { title: "freeCodeCamp on YouTube", url: "https://www.youtube.com/@freecodecamp", kind: "video" },
  learncpp: { title: "LearnCpp.com", url: "https://www.learncpp.com/", kind: "docs" },
  gitbranch: { title: "Learn Git Branching (interactive)", url: "https://learngitbranching.js.org/", kind: "practice" },
  ccCompsci: {
    title: "Crash Course Computer Science (playlist)",
    url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo",
    kind: "video",
  },
  nand2tetris: { title: "Nand2Tetris: build a computer from first principles", url: "https://www.nand2tetris.org/", kind: "course" },
  khanInternet: {
    title: "Khan Academy: Computers and the Internet",
    url: "https://www.khanacademy.org/computing/computers-and-internet",
    kind: "course",
  },
  practicalNet: { title: "Practical Networking", url: "https://www.practicalnetworking.net/", kind: "docs" },
  messer: { title: "Professor Messer (networking videos)", url: "https://www.youtube.com/@ProfessorMesser", kind: "video" },
  mdnLearn: { title: "MDN: Learn web development", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development", kind: "docs" },
  mdnFlex: {
    title: "MDN: Basic concepts of flexbox",
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox",
    kind: "docs",
  },
  webdevDesign: { title: "web.dev: Learn Responsive Design", url: "https://web.dev/learn/design", kind: "course" },
  webdevCss: { title: "web.dev: Learn CSS", url: "https://web.dev/learn/css", kind: "course" },
  kevinPowell: { title: "Kevin Powell (CSS videos)", url: "https://www.youtube.com/@KevinPowell", kind: "video" },
  sqlbolt: { title: "SQLBolt (interactive SQL lessons)", url: "https://sqlbolt.com/", kind: "practice" },
  w3sql: { title: "W3Schools SQL tutorial", url: "https://www.w3schools.com/sql/", kind: "docs" },
  csharp: { title: "Microsoft C# documentation", url: "https://learn.microsoft.com/en-us/dotnet/csharp/", kind: "docs" },
  csharpOop: {
    title: "C#: Object-oriented programming",
    url: "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/",
    kind: "docs",
  },
  refactoring: { title: "Refactoring.Guru: design patterns", url: "https://refactoring.guru/design-patterns", kind: "docs" },
  khanStats: {
    title: "Khan Academy: Statistics and probability",
    url: "https://www.khanacademy.org/math/statistics-probability",
    kind: "course",
  },
  ccStats: {
    title: "Crash Course Statistics (playlist)",
    url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtNM_Y-bUAhblSAdWRnmBUcr",
    kind: "video",
  },
  statquest: { title: "StatQuest with Josh Starmer", url: "https://www.youtube.com/@statquest", kind: "video" },
  kaggle: { title: "Kaggle Learn (free micro-courses)", url: "https://www.kaggle.com/learn", kind: "practice" },
  kaggleProg: { title: "Kaggle: Intro to Programming", url: "https://www.kaggle.com/learn/intro-to-programming", kind: "practice" },
  elementsAi: { title: "Elements of AI (free course)", url: "https://www.elementsofai.com/", kind: "course" },
  googleMl: {
    title: "Google Machine Learning Crash Course",
    url: "https://developers.google.com/machine-learning/crash-course",
    kind: "course",
  },
  nnPlaylist: {
    title: "3Blue1Brown: Neural networks (playlist)",
    url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi",
    kind: "video",
  },
  accountingCoach: { title: "AccountingCoach (explanations and quizzes)", url: "https://www.accountingcoach.com/", kind: "practice" },
  khanFinance: {
    title: "Khan Academy: Core finance",
    url: "https://www.khanacademy.org/economics-finance-domain/core-finance",
    kind: "course",
  },
  hubspot: { title: "HubSpot Academy (free marketing courses)", url: "https://academy.hubspot.com/", kind: "course" },
  excel: { title: "Microsoft Excel help and training", url: "https://support.microsoft.com/en-us/excel", kind: "docs" },
  canva: { title: "Canva Design School", url: "https://www.canva.com/learn/design/", kind: "course" },
  idf: { title: "Interaction Design Foundation: literature", url: "https://www.interaction-design.org/literature", kind: "docs" },
  figma: { title: "Figma Learn (help centre)", url: "https://help.figma.com/hc/en-us", kind: "docs" },
  nngHeuristics: {
    title: "NN/g: 10 usability heuristics",
    url: "https://www.nngroup.com/articles/ten-usability-heuristics/",
    kind: "docs",
  },
  lawsOfUx: { title: "Laws of UX", url: "https://lawsofux.com/", kind: "docs" },
};

// OnTrack-style task codes end in the grade they count toward. Plans include
// the tasks up to the student's target grade.
export const GRADES = ["Pass", "Credit", "Distinction", "High Distinction"];
const GRADE_OF = { P: 0, C: 1, D: 2, HD: 3 };
export function taskGrade(task) {
  const m = /^\d+\.\d+(HD|P|C|D)\b/.exec(task);
  return m ? GRADE_OF[m[1]] : 0;
}

// Six blocks per trimester. tasks: sample names; resources: RESOURCES keys;
// tip: { by: seeded profile id, text }.
export const OUTLINES = {
  SIT102: [
    { weeks: "1-2", topic: "Setting up, sequence and variables", tasks: ["1.1P Hello world in C++", "1.2P Variables and user input", "2.1P Procedures that draw with SplashKit"], resources: ["splashkit", "learncpp", "cs50yt"], tip: { by: "p2", text: "Type every example yourself instead of copying. It feels slow in week 1 and saves you in week 4." } },
    { weeks: "3-4", topic: "Branching, loops and functions", tasks: ["3.1P Decisions with if and switch", "3.2C Loop-based game logic", "4.1P Functions with parameters"], resources: ["learncpp", "cs50", "splashkit"], tip: { by: "p9", text: "Draw the loop on paper with the values of each variable per round. It finally clicked for me that way." } },
    { weeks: "5-6", topic: "Arrays and structs", tasks: ["5.1P Arrays of values", "5.2C Structs to group data", "6.1D Custom program design report"], resources: ["learncpp", "cs50yt", "fcc"], tip: { by: "p7", text: "Arrays made sense when I pictured them as numbered parking spots. Index 0 is the first spot." } },
    { weeks: "7-8", topic: "Pointers and dynamic memory", tasks: ["7.1P Pointers basics", "7.2C Dynamic arrays", "8.1D Linked data structure"], resources: ["learncpp", "cs50", "cs50yt"], tip: { by: "p1", text: "For pointers, draw boxes and arrows for every line. Most bugs show up the moment you draw them." } },
    { weeks: "9-10", topic: "Bigger programs: files, debugging and your own project", tasks: ["9.1P Reading and writing files", "9.2HD Custom program with extension", "10.1C Debugging journal"], resources: ["splashkit", "gitbranch", "learncpp"], tip: { by: "p2", text: "Read the first error message only. Fix it, rebuild, repeat. The later errors are usually caused by the first one." } },
    { weeks: "11", topic: "Portfolio and review", tasks: ["11.1P Learning summary report", "11.2D Portfolio reflection"], resources: ["cs50yt", "learncpp"], tip: { by: "p1", text: "Start the learning summary early and link each claim to a task you actually finished." } },
  ],
  SIT232: [
    { weeks: "1-2", topic: "C# basics and classes", tasks: ["1.1P C# hello world and types", "2.1P Your first class"], resources: ["csharp", "csharpOop"], tip: { by: "p2", text: "If you did SIT102 in C++, write the same small program in C# side by side. The syntax gap is smaller than it looks." } },
    { weeks: "3-4", topic: "Encapsulation and object relationships", tasks: ["3.1P Properties and private fields", "4.1C Objects that own other objects"], resources: ["csharpOop", "refactoring"], tip: { by: "p1", text: "Sketch a quick UML class diagram before coding. Five minutes on paper saves an hour of refactoring." } },
    { weeks: "5-6", topic: "Inheritance and polymorphism", tasks: ["5.1P Inheritance hierarchy", "6.1C Polymorphic shapes", "6.2D Design report"], resources: ["csharpOop", "refactoring", "cs50yt"], tip: { by: "p2", text: "Only inherit when 'is a' really holds. A Student is a Person; a Car is not an Engine." } },
    { weeks: "7-8", topic: "Interfaces and abstraction", tasks: ["7.1P Interfaces", "8.1C Abstract classes in a game"], resources: ["refactoring", "csharp"], tip: { by: "p1", text: "Name interfaces after what they let you do (IDrawable), not what they are." } },
    { weeks: "9-10", topic: "Design patterns and testing", tasks: ["9.1P Unit tests", "9.2D Apply a design pattern", "10.1HD Custom OO program"], resources: ["refactoring", "gitbranch"], tip: { by: "p2", text: "Write the test first for one small method. It changes how you design the class." } },
    { weeks: "11", topic: "Portfolio and review", tasks: ["11.1P Learning summary"], resources: ["csharpOop"], tip: { by: "p1", text: "Explain one design decision you would change now. Markers like seeing that you learned something." } },
  ],
  SIT215: [
    { weeks: "1-2", topic: "What AI is: agents and search problems", tasks: ["1.1P Define an agent and its environment", "2.1P Uninformed search by hand"], resources: ["elementsAi", "ccCompsci"], tip: { by: "p1", text: "Trace breadth-first and depth-first search on a tiny graph by hand before writing any code." } },
    { weeks: "3-4", topic: "Informed search and games", tasks: ["3.1P A* on a grid", "4.1C Minimax for a simple game"], resources: ["elementsAi", "cs50"], tip: { by: "p1", text: "Write down why your heuristic never overestimates. That one sentence is most of the marks." } },
    { weeks: "5-6", topic: "Probability and reasoning under uncertainty", tasks: ["5.1P Bayes' rule exercises", "6.1C Naive Bayes classifier"], resources: ["khanStats", "statquest"], tip: { by: "p10", text: "StatQuest's videos on Bayes made the formula feel like common sense." } },
    { weeks: "7-8", topic: "Machine learning basics", tasks: ["7.1P Train and test split", "8.1D Compare two models"], resources: ["googleMl", "kaggle", "statquest"], tip: { by: "p1", text: "Always keep a test set you never touch until the end, even in small tasks." } },
    { weeks: "9-10", topic: "Neural networks", tasks: ["9.1P Perceptron by hand", "10.1HD Small neural network project"], resources: ["nnPlaylist", "googleMl"], tip: { by: "p1", text: "Watch the 3Blue1Brown neural network videos twice: once for the picture, once with a pen." } },
    { weeks: "11", topic: "Ethics, limits and review", tasks: ["11.1P Reflection on AI risks"], resources: ["elementsAi"], tip: { by: "p1", text: "Bring a real example of an AI failure into your reflection. It makes the argument concrete." } },
  ],
  SIT111: [
    { weeks: "1-2", topic: "Data representation: binary, hex and two's complement", tasks: ["1.1P Number systems", "2.1P Representing text and images"], resources: ["ccCompsci", "khanInternet"], tip: { by: "p5", text: "Do ten conversions a day for a week. Binary becomes muscle memory fast." } },
    { weeks: "3-4", topic: "Logic gates and circuits", tasks: ["3.1P Truth tables", "4.1C Build an adder"], resources: ["nand2tetris", "ccCompsci"], tip: { by: "p5", text: "Nand2Tetris chapter 1 and 2 are the best practice for this part. Build the gates yourself." } },
    { weeks: "5-6", topic: "CPU, memory and machine code", tasks: ["5.1P Fetch-decode-execute cycle", "6.1C Trace a simple program"], resources: ["ccCompsci", "nand2tetris"], tip: { by: "p11", text: "Tracing the fetch-decode-execute cycle step by step on a table was the thing that made it click." } },
    { weeks: "7-8", topic: "Assembly and the stack", tasks: ["7.1P Assembly basics", "8.1D Function calls and the stack"], resources: ["nand2tetris", "cs50yt"], tip: { by: "p5", text: "Draw the stack after every push and pop. Most stack bugs are visible on paper." } },
    { weeks: "9-10", topic: "Operating systems: processes and memory", tasks: ["9.1P Processes and scheduling", "10.1HD Research report"], resources: ["ccCompsci", "khanInternet"], tip: { by: "p5", text: "Relate each OS idea to something you see on your laptop, like Task Manager for scheduling." } },
    { weeks: "11", topic: "Review", tasks: ["11.1P Learning summary"], resources: ["ccCompsci"], tip: { by: "p5", text: "Make a one-page cheat sheet of conversions and gate symbols. Making it is the revision." } },
  ],
  SIT120: [
    { weeks: "1-2", topic: "HTML structure and accessibility", tasks: ["1.1P Semantic HTML page", "2.1P Forms and labels"], resources: ["mdnLearn", "fcc"], tip: { by: "p5", text: "Use real elements (button, nav, label). Accessibility marks come almost for free." } },
    { weeks: "3-4", topic: "CSS layout: box model and flexbox", tasks: ["3.1P Box model exercises", "4.1C Flexbox layout"], resources: ["mdnFlex", "webdevCss", "kevinPowell"], tip: { by: "p5", text: "Put a temporary outline on every element while you build a layout. You'll see the boxes instantly." } },
    { weeks: "5-6", topic: "Responsive design and grid", tasks: ["5.1P Mobile-first page", "6.1C CSS grid gallery", "6.2D Responsive case study"], resources: ["webdevDesign", "kevinPowell"], tip: { by: "p7", text: "Design for the phone first, then add space for desktop. Going the other way is painful." } },
    { weeks: "7-8", topic: "JavaScript and the DOM", tasks: ["7.1P DOM manipulation", "8.1C Fetch data from an API"], resources: ["mdnLearn", "fccyt"], tip: { by: "p5", text: "console.log everything. Then delete the logs before you submit." } },
    { weeks: "9-10", topic: "A framework and your web app", tasks: ["9.1P Components", "10.1HD Responsive web app"], resources: ["fcc", "gitbranch"], tip: { by: "p5", text: "Commit to git after every working step. You will want to go back at least once." } },
    { weeks: "11", topic: "Deploy and reflect", tasks: ["11.1P Deploy and summary"], resources: ["mdnLearn"], tip: { by: "p5", text: "Test your deployed site on your phone before submitting. It's what the marker will do." } },
  ],
  SIT202: [
    { weeks: "1-2", topic: "How the internet works: layers and models", tasks: ["1.1P OSI and TCP/IP layers", "2.1P Packet capture basics"], resources: ["khanInternet", "practicalNet"], tip: { by: "p11", text: "Learn one sentence per layer that says what it does. Everything else hangs off those seven sentences." } },
    { weeks: "3-4", topic: "Application layer: HTTP, DNS and email", tasks: ["3.1P DNS lookup walkthrough", "4.1C HTTP requests by hand"], resources: ["practicalNet", "messer"], tip: { by: "p11", text: "Open your browser's network tab while you study HTTP. Seeing real requests helps a lot." } },
    { weeks: "5-6", topic: "Transport layer: TCP and UDP", tasks: ["5.1P TCP handshake", "6.1C Reliable transfer"], resources: ["practicalNet", "messer"], tip: { by: "p11", text: "Act out the three-way handshake with a friend. Silly, but you won't forget it." } },
    { weeks: "7-8", topic: "Network layer: IP addressing and routing", tasks: ["7.1P Subnetting practice", "8.1D Routing tables"], resources: ["practicalNet", "messer"], tip: { by: "p11", text: "Subnetting is pure practice. Do a few every day instead of a lot the night before." } },
    { weeks: "9-10", topic: "Link layer, wireless and security", tasks: ["9.1P Ethernet and ARP", "10.1HD Network design report"], resources: ["messer", "khanInternet"], tip: { by: "p11", text: "For the design report, draw the network first and write about the drawing." } },
    { weeks: "11", topic: "Review", tasks: ["11.1P Learning summary"], resources: ["practicalNet"], tip: { by: "p11", text: "Make flashcards for port numbers and protocols. Quick wins in the exam." } },
  ],
  SIT103: [
    { weeks: "1-2", topic: "Relational model and SELECT", tasks: ["1.1P Tables, rows and keys", "2.1P Simple queries"], resources: ["sqlbolt", "w3sql"], tip: { by: "p3", text: "Do the SQLBolt lessons in order. They are short and the practice is instant." } },
    { weeks: "3-4", topic: "Filtering, sorting and joins", tasks: ["3.1P WHERE and ORDER BY", "4.1C Joins across tables"], resources: ["sqlbolt", "w3sql"], tip: { by: "p10", text: "Before writing a join, write down which column links the two tables. Half the bugs vanish." } },
    { weeks: "5-6", topic: "Aggregation and grouping", tasks: ["5.1P GROUP BY and HAVING", "6.1C Reporting queries"], resources: ["sqlbolt", "kaggle"], tip: { by: "p3", text: "If GROUP BY confuses you, run the query without it first and look at the rows." } },
    { weeks: "7-8", topic: "Database design: ER diagrams and normalisation", tasks: ["7.1P ER diagram", "8.1D Normalise to 3NF"], resources: ["w3sql", "cs50yt"], tip: { by: "p3", text: "Normalise by asking 'does this column depend on the whole key?' for every column." } },
    { weeks: "9-10", topic: "Constraints, indexes and transactions", tasks: ["9.1P Constraints", "10.1HD Database project"], resources: ["w3sql", "sqlbolt"], tip: { by: "p10", text: "Insert some bad data on purpose to check your constraints actually stop it." } },
    { weeks: "11", topic: "Review", tasks: ["11.1P Learning summary"], resources: ["sqlbolt"], tip: { by: "p3", text: "Redo your earlier queries from memory. It's the best revision for the exam." } },
  ],
  SIT191: [
    { weeks: "1-2", topic: "Describing data: types, centre and spread", tasks: ["Week 1 quiz: types of data", "Week 2 lab: summary statistics"], resources: ["khanStats", "ccStats"], tip: { by: "p3", text: "Always plot the data before calculating anything. The plot tells you which summary makes sense." } },
    { weeks: "3-4", topic: "Probability and distributions", tasks: ["Week 3 lab: probability rules", "Week 4 quiz: the normal distribution"], resources: ["khanStats", "statquest"], tip: { by: "p10", text: "StatQuest explains distributions in ten minutes better than any textbook chapter I tried." } },
    { weeks: "5-6", topic: "Sampling and confidence intervals", tasks: ["Assignment 1: descriptive analysis (sample)", "Week 6 lab: confidence intervals"], resources: ["ccStats", "khanStats"], tip: { by: "p3", text: "Write the interpretation sentence for every interval you compute. That sentence is where the marks are." } },
    { weeks: "7-8", topic: "Hypothesis testing", tasks: ["Week 7 lab: t-tests", "Week 8 quiz: p-values"], resources: ["statquest", "khanStats"], tip: { by: "p10", text: "State the null hypothesis in plain words first. Then the formula is just bookkeeping." } },
    { weeks: "9-10", topic: "Correlation and regression", tasks: ["Week 9 lab: regression in a spreadsheet", "Assignment 2: data analysis report (sample)"], resources: ["statquest", "kaggle"], tip: { by: "p3", text: "Correlation is not causation, and markers check that you said so." } },
    { weeks: "11", topic: "Exam preparation", tasks: ["Practice exam"], resources: ["khanStats"], tip: { by: "p3", text: "Do past-style questions under time. Speed matters in this exam." } },
  ],
  MMK101: [
    { weeks: "1-2", topic: "What marketing is: needs, value and the marketing mix", tasks: ["Week 1 tutorial: marketing concept", "Week 2 quiz: the 4Ps"], resources: ["hubspot"], tip: { by: "p13", text: "Every time a lecture introduces a theory, find one brand you know that uses it. Your notes turn into examples." } },
    { weeks: "3-4", topic: "Consumer behaviour and research", tasks: ["Week 3 tutorial: buying decision process", "Week 4: survey design activity"], resources: ["hubspot"], tip: { by: "p14", text: "Run a tiny survey with five friends. Real data makes the research section much easier." } },
    { weeks: "5-6", topic: "Segmentation, targeting and positioning", tasks: ["Assessment 1: market analysis report (sample)", "Week 6 tutorial: positioning map"], resources: ["hubspot", "canva"], tip: { by: "p13", text: "Draw a positioning map for a real market. It's quick and it shows you understand STP." } },
    { weeks: "7-8", topic: "Product, brand and pricing", tasks: ["Week 7 tutorial: branding", "Week 8 quiz: pricing strategies"], resources: ["hubspot"], tip: { by: "p4", text: "Link price to positioning. A premium brand on a discount price confuses customers." } },
    { weeks: "9-10", topic: "Promotion, digital and distribution", tasks: ["Assessment 2: marketing plan (sample)", "Week 10 group presentation"], resources: ["hubspot", "canva"], tip: { by: "p14", text: "For the group presentation, practise the handovers between speakers. That's where it falls apart." } },
    { weeks: "11", topic: "Exam preparation", tasks: ["Practice exam questions"], resources: ["hubspot"], tip: { by: "p13", text: "Make a one-page map of every theory with one brand example each." } },
  ],
  MAA103: [
    { weeks: "1-2", topic: "The accounting equation and transactions", tasks: ["Week 1 tutorial: accounting equation", "Week 2 quiz: recording transactions"], resources: ["accountingCoach", "khanFinance"], tip: { by: "p4", text: "Every transaction hits two places. Write both before you move on." } },
    { weeks: "3-4", topic: "Debits, credits and the trial balance", tasks: ["Week 3 practice set: journal entries", "Week 4 tutorial: trial balance"], resources: ["accountingCoach"], tip: { by: "p4", text: "Debit and credit just mean left and right on the T-account. Stop reading meaning into the words." } },
    { weeks: "5-6", topic: "Adjusting entries and financial statements", tasks: ["Assessment 1: financial statements task (sample)", "Week 6 tutorial: adjustments"], resources: ["accountingCoach", "khanFinance"], tip: { by: "p8", text: "Adjusting entries were where I panicked. Doing three slowly with a friend fixed it." } },
    { weeks: "7-8", topic: "Cost behaviour and CVP analysis", tasks: ["Week 7 tutorial: fixed and variable costs", "Week 8 quiz: break-even"], resources: ["khanFinance", "excel"], tip: { by: "p4", text: "Build the break-even model in Excel. Changing one number and watching it move is the best explanation." } },
    { weeks: "9-10", topic: "Budgeting and decision making", tasks: ["Assessment 2: budget case study (sample)", "Week 10 tutorial: relevant costs"], resources: ["excel", "khanFinance"], tip: { by: "p4", text: "For decisions, ignore costs that are the same either way. Only the differences matter." } },
    { weeks: "11", topic: "Exam preparation", tasks: ["Practice exam"], resources: ["accountingCoach"], tip: { by: "p4", text: "Redo the tutorial questions without the solutions open. Timed." } },
  ],
  MIS171: [
    { weeks: "1-2", topic: "Data in business and spreadsheets", tasks: ["Week 1 tutorial: business questions as data", "Week 2 lab: Excel basics"], resources: ["excel", "kaggle"], tip: { by: "p4", text: "Learn five Excel shortcuts in week 1. You'll use them every lab." } },
    { weeks: "3-4", topic: "Cleaning and summarising data", tasks: ["Week 3 lab: cleaning a dataset", "Week 4 lab: pivot tables"], resources: ["excel", "kaggle"], tip: { by: "p4", text: "Keep the raw data in its own sheet and never edit it. Clean in a copy." } },
    { weeks: "5-6", topic: "Descriptive analytics and visualisation", tasks: ["Assessment 1: dashboard (sample)", "Week 6 lab: choosing charts"], resources: ["excel", "khanStats"], tip: { by: "p3", text: "Start every chart with the question it answers, written as its title." } },
    { weeks: "7-8", topic: "Forecasting basics", tasks: ["Week 7 lab: trends and moving averages", "Week 8 quiz: forecasting"], resources: ["khanStats", "statquest"], tip: { by: "p4", text: "Explain your forecast in one plain sentence a manager would understand." } },
    { weeks: "9-10", topic: "Predictive analytics and decisions", tasks: ["Assessment 2: analytics report (sample)", "Week 10 lab: regression for prediction"], resources: ["statquest", "kaggle"], tip: { by: "p4", text: "End the report with a recommendation, not just results. That's the business part." } },
    { weeks: "11", topic: "Review", tasks: ["Practice exam"], resources: ["excel"], tip: { by: "p4", text: "Rebuild one lab from scratch without notes as revision." } },
  ],
  ADD105: [
    { weeks: "1-2", topic: "Elements of design: line, shape, colour, type", tasks: ["Week 1 studio: visual journal", "Week 2 exercise: colour studies"], resources: ["canva", "idf"], tip: { by: "p6", text: "Keep a visual journal and add one thing you like every day, with a note on why." } },
    { weeks: "3-4", topic: "Principles: contrast, hierarchy, alignment", tasks: ["Week 3 exercise: hierarchy poster", "Week 4 critique"], resources: ["canva", "idf"], tip: { by: "p12", text: "Squint at your design. Whatever you still see is your hierarchy." } },
    { weeks: "5-6", topic: "Typography and layout grids", tasks: ["Assessment 1: typographic poster (sample)", "Week 6 exercise: grid layouts"], resources: ["canva", "figma"], tip: { by: "p6", text: "Use two typefaces at most. Make the difference between them obvious." } },
    { weeks: "7-8", topic: "Image, composition and brand", tasks: ["Week 7 studio: photo composition", "Week 8 exercise: logo sketches"], resources: ["canva", "idf"], tip: { by: "p6", text: "Sketch thirty rough logo ideas before opening any software." } },
    { weeks: "9-10", topic: "Design process and presenting work", tasks: ["Assessment 2: brand project (sample)", "Week 10 critique"], resources: ["figma", "idf"], tip: { by: "p12", text: "Show your process in the presentation, not only the final piece. Markers want the thinking." } },
    { weeks: "11", topic: "Portfolio", tasks: ["Folio submission"], resources: ["canva"], tip: { by: "p6", text: "Pick fewer, stronger pieces for the folio and write one line on each." } },
  ],
  ADT202: [
    { weeks: "1-2", topic: "Interface design and users", tasks: ["Week 1 studio: user needs", "Week 2 exercise: personas"], resources: ["idf", "nngHeuristics"], tip: { by: "p6", text: "Talk to two real users before designing anything. Even friends count." } },
    { weeks: "3-4", topic: "Usability heuristics and UX laws", tasks: ["Week 3: heuristic evaluation", "Week 4 exercise: apply Laws of UX"], resources: ["nngHeuristics", "lawsOfUx"], tip: { by: "p6", text: "Run Nielsen's ten heuristics over an app you use daily. You'll spot problems everywhere after that." } },
    { weeks: "5-6", topic: "Wireframes and prototypes in Figma", tasks: ["Assessment 1: wireframes (sample)", "Week 6 studio: clickable prototype"], resources: ["figma", "idf"], tip: { by: "p12", text: "Grey boxes first. Colour and fonts only once the flow works." } },
    { weeks: "7-8", topic: "Visual design for screens", tasks: ["Week 7: design system basics", "Week 8: responsive layouts"], resources: ["figma", "webdevDesign"], tip: { by: "p6", text: "Make components for anything you use twice. Changes later take seconds." } },
    { weeks: "9-10", topic: "Testing and iterating", tasks: ["Assessment 2: tested prototype (sample)", "Week 10: usability test"], resources: ["nngHeuristics", "lawsOfUx"], tip: { by: "p6", text: "Five users find most of the problems. Don't wait for twenty." } },
    { weeks: "11", topic: "Presenting the case study", tasks: ["Case study presentation"], resources: ["idf"], tip: { by: "p12", text: "Tell the case study as a story: problem, what you tried, what you learned." } },
  ],
};

// Every link a plan may use for a unit: its outline's resources.
export function resourcesFor(unitCode) {
  const keys = new Set((OUTLINES[unitCode] ?? []).flatMap((b) => b.resources));
  return [...keys].map((key) => ({ key, ...RESOURCES[key] }));
}
