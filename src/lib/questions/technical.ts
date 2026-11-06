/**
 * Technical MCQs (original items) for drives with a CS-fundamentals section, such as the Deloitte
 * NLA / Cyber Gurukul assessment: DBMS & SQL, networks, operating systems, cyber security, cloud,
 * and programming basics. `answer` indexes `options`; options are shuffled when generated.
 */
import { rng, staticMcq } from "./rng";
import type { Topic } from "./types";

type Item = { prompt: string; options: string[]; answer: number; explanation: string; code?: string };

const DBMS: Item[] = [
  { prompt: "Which SQL clause filters groups after aggregation?", options: ["HAVING", "WHERE", "ORDER BY", "GROUP BY"], answer: 0, explanation: "WHERE filters rows before grouping; HAVING filters the groups produced by GROUP BY." },
  { prompt: "A primary key column can contain:", options: ["Only unique, non-NULL values", "Duplicate values", "NULL values", "Any values at all"], answer: 0, explanation: "A primary key uniquely identifies each row, so it must be unique and NOT NULL." },
  { prompt: "Which normal form removes partial dependency on part of a composite key?", options: ["2NF", "1NF", "3NF", "BCNF"], answer: 0, explanation: "2NF requires every non-key attribute to depend on the whole key, not part of it." },
  { prompt: "Which command removes all rows but keeps the table, and cannot take a WHERE clause?", options: ["TRUNCATE", "DELETE", "DROP", "ALTER"], answer: 0, explanation: "TRUNCATE empties the table; DELETE can filter with WHERE; DROP removes the table itself." },
  { prompt: "In ACID properties of a transaction, “I” stands for:", options: ["Isolation", "Integrity", "Indexing", "Inheritance"], answer: 0, explanation: "Atomicity, Consistency, Isolation, Durability." },
  { prompt: "Which join returns every row of the left table plus matching rows of the right table?", options: ["LEFT JOIN", "INNER JOIN", "RIGHT JOIN", "CROSS JOIN"], answer: 0, explanation: "LEFT (OUTER) JOIN keeps all left rows; unmatched right columns become NULL." },
  { prompt: "What does this query return when some rows have x as NULL?", code: "SELECT COUNT(*) FROM t WHERE x = NULL;", options: ["0", "The number of rows where x is NULL", "An error", "The total number of rows"], answer: 0, explanation: "A comparison with NULL is never true, so no rows match. Use “x IS NULL” instead." },
  { prompt: "A foreign key is used to:", options: ["Link a row to the primary key of another table", "Speed up every query", "Encrypt a column", "Allow only unique values"], answer: 0, explanation: "A foreign key enforces referential integrity between two tables." },
  { prompt: "Which of these is a DDL (Data Definition Language) command?", options: ["CREATE", "SELECT", "INSERT", "UPDATE"], answer: 0, explanation: "DDL defines structure (CREATE, ALTER, DROP); SELECT/INSERT/UPDATE are DML." },
  { prompt: "Which keyword removes duplicate rows from a SELECT result?", options: ["DISTINCT", "UNIQUE", "DIFFERENT", "SINGLE"], answer: 0, explanation: "SELECT DISTINCT returns each distinct row once." },
  { prompt: "An index on a column mainly:", options: ["Speeds up searches on that column", "Encrypts the column", "Prevents NULL values", "Reduces the table's size"], answer: 0, explanation: "Indexes speed up lookups at the cost of extra storage and slower writes." },
  { prompt: "What does this query return?", code: "SELECT dept, AVG(salary)\nFROM emp\nGROUP BY dept;", options: ["One row per department with its average salary", "The company-wide average salary", "Every employee with their salary", "Departments sorted by salary"], answer: 0, explanation: "GROUP BY dept makes one group per department; AVG is computed per group." },
  { prompt: "Which SQL command is used to undo changes made in the current transaction?", options: ["ROLLBACK", "COMMIT", "REVOKE", "SAVE"], answer: 0, explanation: "ROLLBACK undoes uncommitted changes; COMMIT makes them permanent." },
];

const NETWORKS: Item[] = [
  { prompt: "Which OSI layer is responsible for routing packets between networks?", options: ["Network layer", "Data link layer", "Transport layer", "Session layer"], answer: 0, explanation: "The network layer (layer 3) handles logical addressing (IP) and routing." },
  { prompt: "What is the default port for HTTPS?", options: ["443", "80", "21", "25"], answer: 0, explanation: "HTTPS uses 443; HTTP 80, FTP 21, SMTP 25." },
  { prompt: "Which protocol translates domain names into IP addresses?", options: ["DNS", "DHCP", "ARP", "FTP"], answer: 0, explanation: "DNS resolves names like example.com to IP addresses." },
  { prompt: "Compared with UDP, TCP is:", options: ["Connection-oriented and reliable", "Faster because it skips the handshake", "Used only for video streaming", "Connectionless"], answer: 0, explanation: "TCP sets up a connection and guarantees ordered, reliable delivery; UDP does neither." },
  { prompt: "How many bits are in an IPv4 address?", options: ["32", "64", "128", "16"], answer: 0, explanation: "IPv4 addresses are 32 bits (four octets); IPv6 addresses are 128 bits." },
  { prompt: "Which protocol automatically assigns IP addresses to devices on a network?", options: ["DHCP", "DNS", "SMTP", "ICMP"], answer: 0, explanation: "DHCP leases IP addresses and network settings to devices." },
  { prompt: "ARP is used to find:", options: ["The MAC address for a known IP address", "The IP address for a domain name", "The port number of a service", "The fastest route to a network"], answer: 0, explanation: "ARP maps an IP address to a MAC address on the local network." },
  { prompt: "Which device forwards frames using MAC addresses at the data link layer?", options: ["Switch", "Router", "Hub", "Repeater"], answer: 0, explanation: "A switch learns MAC addresses and forwards frames only to the right port." },
  { prompt: "Which subnet mask corresponds to /24?", options: ["255.255.255.0", "255.255.0.0", "255.0.0.0", "255.255.255.255"], answer: 0, explanation: "/24 means the first 24 bits are network bits: 255.255.255.0." },
  { prompt: "The ping command uses which protocol?", options: ["ICMP", "TCP", "FTP", "SMTP"], answer: 0, explanation: "Ping sends ICMP Echo Request messages and waits for Echo Replies." },
  { prompt: "How many usable host addresses does a /24 network have?", options: ["254", "256", "255", "252"], answer: 0, explanation: "2⁸ = 256 addresses, minus the network and broadcast addresses = 254." },
  { prompt: "Which of these is a private IPv4 address?", options: ["192.168.1.10", "8.8.8.8", "172.32.0.1", "11.0.0.1"], answer: 0, explanation: "Private ranges are 10.0.0.0/8, 172.16.0.0–172.31.255.255 and 192.168.0.0/16. 172.32.0.1 is outside them." },
  { prompt: "Which layer of the OSI model does TCP belong to?", options: ["Transport layer", "Network layer", "Application layer", "Physical layer"], answer: 0, explanation: "TCP and UDP are transport-layer (layer 4) protocols." },
];

const OS: Item[] = [
  { prompt: "Which of these is NOT one of the four necessary conditions for deadlock?", options: ["Preemption", "Mutual exclusion", "Hold and wait", "Circular wait"], answer: 0, explanation: "The four conditions are mutual exclusion, hold and wait, NO preemption, and circular wait." },
  { prompt: "Threads of the same process share:", options: ["The same address space", "A separate copy of all global variables", "Different program code", "No resources at all"], answer: 0, explanation: "Threads share code, data and heap; each has its own stack and registers." },
  { prompt: "Which scheduling algorithm can starve long jobs?", options: ["Shortest Job First", "Round Robin", "First Come First Served", "Fair-share scheduling"], answer: 0, explanation: "If short jobs keep arriving, SJF may never pick a long job." },
  { prompt: "Virtual memory allows:", options: ["Programs larger than physical RAM to run", "A faster CPU clock", "More CPU cores", "Running programs directly from the network card"], answer: 0, explanation: "Pages not in use are kept on disk, so a program's address space can exceed RAM." },
  { prompt: "A page fault occurs when:", options: ["A program accesses a page that is not in RAM", "The CPU overheats", "A file is deleted", "Two processes share memory"], answer: 0, explanation: "The OS must then load the page from disk into a frame." },
  { prompt: "A semaphore is mainly used for:", options: ["Synchronising access to shared resources", "Allocating disk blocks", "Compiling programs", "Routing network packets"], answer: 0, explanation: "Semaphores coordinate processes or threads, e.g. to protect a critical section." },
  { prompt: "Thrashing means the system:", options: ["Spends more time swapping pages than executing", "Has a CPU that is overheating", "Has too many open files", "Has a crashed disk"], answer: 0, explanation: "With too little memory per process, page faults dominate and useful work drops." },
  { prompt: "A context switch is:", options: ["Saving one process's state and loading another's", "Changing the keyboard layout", "Restarting the computer", "Moving a file to another folder"], answer: 0, explanation: "The CPU switches between processes by saving and restoring their registers and state." },
  { prompt: "Which is NOT a function of an operating system?", options: ["Compiling source code into machine code", "Memory management", "Process scheduling", "File management"], answer: 0, explanation: "Compiling is done by a compiler, which is an application, not the OS." },
  { prompt: "In Round Robin scheduling, each process gets:", options: ["A fixed time slice, in turn", "The CPU until it finishes", "CPU time based on its size", "A random amount of time"], answer: 0, explanation: "Round Robin cycles through ready processes, giving each a fixed quantum." },
  { prompt: "The kernel is:", options: ["The core of the OS that manages hardware and resources", "A type of user application", "A part of the web browser", "A file format"], answer: 0, explanation: "The kernel runs in privileged mode and manages CPU, memory and devices." },
  { prompt: "A zombie process is one that:", options: ["Has finished, but whose entry remains until its parent reads its exit status", "Uses too much CPU", "Is a virus", "Is waiting for keyboard input"], answer: 0, explanation: "The process table entry stays until the parent calls wait()." },
  { prompt: "Which memory is the fastest?", options: ["CPU registers", "Cache", "RAM", "SSD"], answer: 0, explanation: "Speed order: registers > cache > RAM > SSD/disk." },
];

const SECURITY: Item[] = [
  { prompt: "In information security, the CIA triad stands for:", options: ["Confidentiality, Integrity, Availability", "Control, Identity, Access", "Cyber, Internet, Authentication", "Confidentiality, Inspection, Audit"], answer: 0, explanation: "The three core goals: keep data secret, keep it correct, keep it accessible." },
  { prompt: "Phishing is:", options: ["Tricking users into revealing information through fake messages", "Encrypting files and demanding a ransom", "Flooding a server with traffic", "Scanning a network for open ports"], answer: 0, explanation: "Phishing is social engineering, usually via email, SMS or fake websites." },
  { prompt: "Ransomware:", options: ["Encrypts a victim's files and demands payment", "Only shows unwanted ads", "Only records keystrokes", "Only slows down the network"], answer: 0, explanation: "The attacker withholds the decryption key until a ransom is paid." },
  { prompt: "A DDoS attack aims to:", options: ["Make a service unavailable by flooding it with traffic", "Steal passwords", "Change a website's content", "Guess encryption keys"], answer: 0, explanation: "Distributed Denial of Service uses many machines to overwhelm a target." },
  { prompt: "SQL injection is best prevented by:", options: ["Using parameterised queries", "Hiding the database server's name", "Using longer table names", "Disabling HTTPS"], answer: 0, explanation: "Parameterised queries keep user input as data, never as SQL code." },
  { prompt: "Multi-factor authentication (MFA) combines:", options: ["Two or more independent proofs of identity", "Two different passwords", "A password and its hint", "A username and an email address"], answer: 0, explanation: "Factors are something you know, have or are, e.g. a password plus an OTP." },
  { prompt: "Symmetric encryption uses:", options: ["The same key to encrypt and decrypt", "A public and private key pair", "No key at all", "Only hash functions"], answer: 0, explanation: "AES is symmetric; RSA is asymmetric (public/private keys)." },
  { prompt: "A hash function such as SHA-256 is:", options: ["One-way: the input cannot be recovered from the hash", "Reversible with the right key", "The same thing as encryption", "Used only for compressing files"], answer: 0, explanation: "Hashes verify integrity and store passwords; they are not meant to be reversed." },
  { prompt: "A firewall:", options: ["Filters network traffic based on rules", "Speeds up the internet connection", "Stores backups", "Removes viruses from files"], answer: 0, explanation: "Firewalls allow or block traffic by rules on addresses, ports and protocols." },
  { prompt: "The principle of least privilege means:", options: ["Give users only the access they need for their job", "Give administrators access to everything", "Remove all passwords", "Let teams share one account"], answer: 0, explanation: "Limiting access limits the damage if an account is compromised." },
  { prompt: "Cross-site scripting (XSS) is:", options: ["Injecting malicious scripts into pages viewed by other users", "Flooding a server with requests", "Stealing hardware", "Breaking an encryption algorithm"], answer: 0, explanation: "XSS runs attacker code in victims' browsers; output encoding prevents it." },
  { prompt: "A brute-force attack:", options: ["Tries many passwords until one works", "Tricks someone over the phone", "Intercepts Wi-Fi traffic", "Installs a keylogger"], answer: 0, explanation: "Rate limiting, lockouts and long passwords defend against it." },
  { prompt: "A man-in-the-middle attack:", options: ["Secretly intercepts communication between two parties", "Physically steals a laptop", "Floods a server with traffic", "Encrypts files for ransom"], answer: 0, explanation: "The attacker relays and can alter messages; TLS with certificate checks prevents it." },
  { prompt: "Which protocol protects web traffic in transit?", options: ["HTTPS (HTTP over TLS)", "HTTP", "FTP", "Telnet"], answer: 0, explanation: "HTTP, FTP and Telnet send data in plain text." },
  { prompt: "Adding a salt to passwords before hashing:", options: ["Makes identical passwords produce different hashes", "Makes the hash reversible", "Compresses the passwords", "Removes the need for hashing"], answer: 0, explanation: "Salts defeat precomputed (rainbow table) attacks." },
  { prompt: "A VPN mainly provides:", options: ["An encrypted tunnel between your device and another network", "Faster download speeds", "Antivirus protection", "A free domain name"], answer: 0, explanation: "Traffic inside the tunnel is encrypted, protecting it on untrusted networks." },
];

const CLOUD: Item[] = [
  { prompt: "Gmail is an example of which cloud service model?", options: ["SaaS", "IaaS", "PaaS", "On-premise software"], answer: 0, explanation: "Software as a Service: you just use the application over the internet." },
  { prompt: "Renting virtual machines and storage, where you manage the OS yourself, is:", options: ["IaaS", "SaaS", "PaaS", "On-premise hosting"], answer: 0, explanation: "Infrastructure as a Service gives you raw compute, storage and networking." },
  { prompt: "Deploying code without managing servers or the OS (e.g. Google App Engine) is:", options: ["PaaS", "IaaS", "SaaS", "Colocation"], answer: 0, explanation: "Platform as a Service runs your code on a managed platform." },
  { prompt: "In cloud computing, elasticity means:", options: ["Automatically adding or removing resources as demand changes", "Using flexible office space", "Paying a fixed price forever", "Running only one server"], answer: 0, explanation: "Elastic systems scale out at peak load and scale back when demand falls." },
  { prompt: "A private cloud is:", options: ["Cloud infrastructure used by a single organisation", "Shared by everyone on the internet", "Always free", "Never connected to a network"], answer: 0, explanation: "It can be on-premise or hosted, but serves one organisation." },
  { prompt: "A hybrid cloud is:", options: ["A combination of private and public cloud", "A cloud that runs only on laptops", "Two public clouds with the same name", "A cloud without storage"], answer: 0, explanation: "Workloads and data move between private and public environments." },
  { prompt: "Under the shared responsibility model for IaaS, the customer is responsible for:", options: ["Securing the OS and applications they install", "Physical security of the data centre", "Power and cooling", "The physical servers and hypervisor"], answer: 0, explanation: "The provider secures the infrastructure; the customer secures what runs on it." },
  { prompt: "Serverless computing (e.g. AWS Lambda) usually bills you for:", options: ["The time your code actually runs", "A fixed monthly server rate", "The number of employees", "The number of hard disks"], answer: 0, explanation: "You pay per invocation and execution time, not for idle servers." },
  { prompt: "Deploying an application across multiple availability zones mainly improves:", options: ["Availability and fault tolerance", "CPU speed", "Code quality", "Screen resolution"], answer: 0, explanation: "If one zone fails, the others keep serving traffic." },
  { prompt: "A hypervisor is:", options: ["Software that runs multiple virtual machines on one physical machine", "A cloud billing tool", "A type of database", "A network firewall"], answer: 0, explanation: "Virtualisation through hypervisors is the foundation of IaaS." },
  { prompt: "A CDN (Content Delivery Network) mainly:", options: ["Serves content from servers close to users to reduce latency", "Stores relational data", "Encrypts emails", "Compiles code"], answer: 0, explanation: "Edge servers cache content near users so pages load faster." },
  { prompt: "“Pay-as-you-go” pricing means:", options: ["You pay only for the resources you use", "You pay a fixed fee regardless of use", "The service is free forever", "You pay before choosing any service"], answer: 0, explanation: "Usage-based billing is a core cloud characteristic." },
];

const PROGRAMMING: Item[] = [
  { prompt: "What does this C code print?", code: "int a = 5;\nprintf(\"%d\", a++ + 1);", options: ["6", "7", "5", "Compilation error"], answer: 0, explanation: "a++ uses the old value 5, then increments a. 5 + 1 = 6." },
  { prompt: "What is the size of a char in C?", options: ["1 byte", "2 bytes", "4 bytes", "8 bytes"], answer: 0, explanation: "sizeof(char) is always 1 by definition." },
  { prompt: "Defining methods with the same name but different parameters in one class is:", options: ["Method overloading", "Method overriding", "Encapsulation", "Inheritance"], answer: 0, explanation: "Overloading is compile-time polymorphism; overriding replaces a parent's method in a subclass." },
  { prompt: "Encapsulation in OOP means:", options: ["Bundling data with the methods that use it and restricting direct access", "Creating many objects from one class", "Inheriting from more than one class", "Converting one data type into another"], answer: 0, explanation: "Private fields with public methods are the usual way to encapsulate." },
  { prompt: "Runtime polymorphism is achieved through:", options: ["Method overriding", "Method overloading", "Macros", "Constructors"], answer: 0, explanation: "The method called is decided at runtime from the object's actual type." },
  { prompt: "What is the time complexity of binary search on a sorted array?", options: ["O(log n)", "O(n)", "O(n log n)", "O(1)"], answer: 0, explanation: "Each step halves the search range." },
  { prompt: "Which data structure follows LIFO (last in, first out)?", options: ["Stack", "Queue", "Linked list", "Hash table"], answer: 0, explanation: "A stack pushes and pops at the same end; a queue is FIFO." },
  { prompt: "Which data structure does a program use to manage function calls and recursion?", options: ["Stack", "Queue", "Hash table", "Graph"], answer: 0, explanation: "Each call pushes a stack frame; returning pops it." },
  { prompt: "What does this C code print?", code: "int x = 10;\nint *p = &x;\n*p = 20;\nprintf(\"%d\", x);", options: ["20", "10", "The address of x", "Compilation error"], answer: 0, explanation: "p points to x, so writing *p changes x itself." },
  { prompt: "What is the worst-case time complexity of quicksort?", options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"], answer: 0, explanation: "With consistently bad pivots (e.g. an already-sorted array and a first-element pivot), quicksort degrades to O(n²)." },
  { prompt: "Which loop in C always runs its body at least once?", options: ["do-while", "while", "for", "if-else"], answer: 0, explanation: "do-while checks its condition after running the body." },
  { prompt: "What does this C code print?", code: "for (int i = 0; i < 5; i++) {\n  if (i == 3) continue;\n  printf(\"%d\", i);\n}", options: ["0124", "012", "01234", "1234"], answer: 0, explanation: "continue skips printing when i is 3." },
  { prompt: "Which of these is NOT a built-in data type in C?", options: ["string", "int", "float", "char"], answer: 0, explanation: "C has no string type; strings are char arrays ending in '\\0'." },
  { prompt: "A constructor is:", options: ["A special method that runs automatically when an object is created", "A method that deletes an object", "A loop that builds arrays", "A global variable"], answer: 0, explanation: "Constructors initialise a new object's state." },
];

const bank = (items: Item[]) => (seed: number) => staticMcq(rng(seed), items[seed % items.length]);
const topic = (id: string, label: string, weight: number, items: Item[]): Topic => ({
  id, section: "technical", label, weight, targetSec: 50, poolSize: items.length, generate: bank(items),
});

export const technicalTopics: Topic[] = [
  topic("t-security", "Cyber Security", 4, SECURITY),
  topic("t-dbms", "DBMS & SQL", 3, DBMS),
  topic("t-networks", "Computer Networks", 3, NETWORKS),
  topic("t-programming", "Programming & OOP", 3, PROGRAMMING),
  topic("t-os", "Operating Systems", 2, OS),
  topic("t-cloud", "Cloud Computing", 2, CLOUD),
];
